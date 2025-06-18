import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

admin.initializeApp();
const db = admin.firestore();

export const onTransactionCreated = onDocumentCreated(
  "transactions/{txId}",
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.error("No snapshot available");
      return;
    }

    const txData = snap.data();
    if (!txData) {
      logger.error("Transaction data undefined");
      return;
    }

    const {
      transactionTypeId,
      function: transactionFunction,
      workerIds: originalWorkerIds = [],
      paymentGroupIds = [],
      amount: rawAmount,
      iisSettleTransaction
    } = txData as {
      transactionTypeId: string;
      function: string;
      workerIds?: string[];
      paymentGroupIds?: string[];
      amount: number;
      iisSettleTransaction?: boolean;
    };

    // ───────────────────────────────────────────
    // Special case: Settle transaction
    // ───────────────────────────────────────────
    if (iisSettleTransaction) {
      // 1) Build a unique set of worker IDs
      const workerIdSet = new Set<string>();
      if (transactionFunction === "single" && originalWorkerIds.length) {
        workerIdSet.add(originalWorkerIds[0]);
      } else if (transactionFunction === "bulk") {
        originalWorkerIds.forEach(id => workerIdSet.add(id));
      } else if (transactionFunction === "payment-group") {
        for (const pgId of paymentGroupIds) {
          const pgSnap = await db.collection("paymentGroups").doc(pgId).get();
          if (pgSnap.exists) {
            const pgData = pgSnap.data() as { workerIds?: string[] };
            (pgData.workerIds || []).forEach(wid => workerIdSet.add(wid));
          }
        }
      }

      const settledAmounts: Record<string, number> = {};

      // 2) For each worker, run a Firestore transaction:
      //    • read currentBalance
      //    • write a negative settle entry to workerTransactions
      //    • zero out the worker’s currentBalance
      await Promise.all(
        Array.from(workerIdSet).map(async (wid) => {
          const workerRef = db.collection("workers").doc(wid);

          await db.runTransaction(async (t) => {
            const wsnap = await t.get(workerRef);
            if (!wsnap.exists) {
              logger.warn(`Worker ${wid} not found`);
              return;
            }
            const balance = (wsnap.get("currentBalance") as number) || 0;
            settledAmounts[wid] = balance;

            // a) record the settle transaction
            const wtxRef = db.collection("workerTransactions").doc();
            t.set(wtxRef, {
              workerId: wid,
              transactionId: event.params.txId,
              amount: -Math.abs(balance),
              type: "settle",
              createdAt: FieldValue.serverTimestamp()
            });

            // b) zero out the balance
            t.update(workerRef, { currentBalance: 0 });
          });

          logger.log(`Settled worker ${wid}: was ${settledAmounts[wid]}, now 0`);
        })
      );

      // 3) Annotate the original transaction document
      await snap.ref.update({
        settledAmounts,
        wasSettled: true
      });

      logger.log(
        `Transaction ${event.params.txId} completed settle for workers: ${Object.keys(
          settledAmounts
        ).join(", ")}`
      );
      return; // skip the normal flow
    }

    // ───────────────────────────────────────────
    // Normal transaction processing
    // ───────────────────────────────────────────

    // 1) Load TransactionType to check isCredit
    const typeRef = db.collection("transactionTypes").doc(transactionTypeId);
    const typeSnap = await typeRef.get();
    if (!typeSnap.exists) {
      logger.error(`TransactionType ${transactionTypeId} not found`);
      return;
    }
    const typeData = typeSnap.data() as { isCredit: boolean };
    const isCredit = typeData.isCredit;

    // 2) Determine signed delta
    let delta = rawAmount;
    if (isCredit) {
      delta = -Math.abs(delta);
      await snap.ref.update({ amount: delta });
      logger.log(`Flipped credit on TX ${event.params.txId} → ${delta}`);
    }

    // Helper to update one worker’s balance
    async function updateWorkerBalance(workerId: string) {
      await db.collection("workers").doc(workerId).update({
        currentBalance: FieldValue.increment(delta)
      });
      logger.log(`Applied TX ${event.params.txId}: ${delta} → worker ${workerId}`);
    }

    // 3) Branch on transactionFunction
    switch (transactionFunction) {
      case "single": {
        if (originalWorkerIds.length === 0) {
          logger.error(`[single] Missing workerIds on TX ${event.params.txId}`);
          return;
        }
        await updateWorkerBalance(originalWorkerIds[0]);
        break;
      }
      case "bulk": {
        if (originalWorkerIds.length === 0) {
          logger.error(`[bulk] workerIds missing on TX ${event.params.txId}`);
          return;
        }
        for (const wid of originalWorkerIds) {
          await updateWorkerBalance(wid);
        }
        break;
      }
      case "payment-group": {
        if (paymentGroupIds.length === 0) {
          logger.error(
            `[payment-group] paymentGroupIds missing on TX ${event.params.txId}`
          );
          return;
        }
        // 3a) fetch all member worker IDs
        const workerIdSet = new Set<string>();
        for (const pgId of paymentGroupIds) {
          const pgSnap = await db.collection("paymentGroups").doc(pgId).get();
          if (!pgSnap.exists) {
            logger.warn(`[payment-group] Group ${pgId} not found`);
            continue;
          }
          const pgData = pgSnap.data() as { workerIds?: string[] };
          (pgData.workerIds || []).forEach((wid) => workerIdSet.add(wid));
        }
        const allWorkerIds = Array.from(workerIdSet);
        await snap.ref.update({ workerIds: allWorkerIds });
        // 3b) update each balance
        for (const wid of allWorkerIds) {
          await updateWorkerBalance(wid);
        }
        break;
      }
      default:
        logger.warn(
          `Unknown transactionFunction "${transactionFunction}" on TX ${event.params.txId}`
        );
        return;
    }
  }
);
