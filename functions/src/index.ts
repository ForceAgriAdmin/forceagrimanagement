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
      workerIds: originalWorkerIds,
      paymentGroupIds,
      amount: rawAmount,
      iisSettleTransaction
    } = txData as {
      transactionTypeId: string;
      function: string;
      workerIds: string[];
      paymentGroupIds: string[];
      amount: number;
      iisSettleTransaction?: boolean;
    };

    // Special case: Settle transaction
    if (iisSettleTransaction) {
      const workerIdSet = new Set<string>();

      if (transactionFunction === "single" && originalWorkerIds?.length > 0) {
        workerIdSet.add(originalWorkerIds[0]);
      } else if (transactionFunction === "bulk") {
        originalWorkerIds?.forEach((id) => workerIdSet.add(id));
      } else if (transactionFunction === "payment-group") {
        for (const pgId of paymentGroupIds || []) {
          const pgSnap = await db.doc(`paymentGroups/${pgId}`).get();
          if (pgSnap.exists) {
            const pgData = pgSnap.data() as { workerIds: string[] };
            pgData?.workerIds?.forEach((id) => workerIdSet.add(id));
          }
        }
      }

      const settleAmounts: Record<string, number> = {};

      for (const wid of workerIdSet) {
        const workerRef = db.doc(`workers/${wid}`);
        const workerSnap = await workerRef.get();
        if (!workerSnap.exists) continue;

        const workerData = workerSnap.data() as { currentBalance: number };
        const balance = workerData?.currentBalance ?? 0;

        // Store individual settle amount for auditing
        settleAmounts[wid] = balance;

        // Create transaction amount as negative value (expense)
        await db.collection("workerTransactions").add({
          workerId: wid,
          transactionId: event.params.txId,
          amount: -Math.abs(balance),
          type: "settle",
          createdAt: FieldValue.serverTimestamp()
        });

        // Set balance to 0
        await workerRef.update({ currentBalance: 0 });

        logger.log(`Settled worker ${wid} → balance was ${balance}, now 0`);
      }

      // Update the transaction document with audit values
      await snap.ref.update({
        settledAmounts: settleAmounts,
        wasSettled: true
      });

      logger.log(`Transaction ${event.params.txId} marked as settle transaction.`);
      return; // Skip normal transaction processing
    }

    // 1) Load TransactionType to check isCredit
    const typeRef = db.doc(`transactionTypes/${transactionTypeId}`);
    const typeSnap = await typeRef.get();
    if (!typeSnap.exists) {
      logger.error(`TransactionType ${transactionTypeId} not found`);
      return;
    }
    const typeData = typeSnap.data();
    if (!typeData) {
      logger.error(`TransactionType data undefined for ${transactionTypeId}`);
      return;
    }
    const isCredit = (typeData as { isCredit: boolean }).isCredit;

    // 2) Determine signed delta
    let delta = rawAmount;
    if (isCredit) {
      delta = -Math.abs(delta);
      await snap.ref.update({ amount: delta });
      logger.log(`Flipped credit → ${delta}`);
    }

    // Helper to update a single worker’s balance
    async function updateWorkerBalance(workerId: string) {
      await db.doc(`workers/${workerId}`).update({
        currentBalance: FieldValue.increment(delta)
      });
      logger.log(
        `Applied TX ${event.params.txId}: ${delta} → worker ${workerId}`
      );
    }

    // 3) Branch on transactionFunction
    switch (transactionFunction) {
      case "single": {
        if (
          !Array.isArray(originalWorkerIds) ||
          originalWorkerIds.length === 0
        ) {
          logger.error(
            `[single] Missing workerIds on TX ${event.params.txId}`
          );
          return;
        }
        const singleWorkerId = originalWorkerIds[0];
        await updateWorkerBalance(singleWorkerId);
        break;
      }

      case "bulk": {
        if (
          !Array.isArray(originalWorkerIds) ||
          originalWorkerIds.length === 0
        ) {
          logger.error(
            `[bulk] workerIds missing or empty on TX ${event.params.txId}`
          );
          return;
        }
        for (const id of originalWorkerIds) {
          await updateWorkerBalance(id);
        }
        break;
      }

      case "payment-group": {
        if (
          !Array.isArray(paymentGroupIds) ||
          paymentGroupIds.length === 0
        ) {
          logger.error(
            `[payment-group] paymentGroupIds missing or empty on TX ${event.params.txId}`
          );
          return;
        }

        // 3a) Fetch all worker IDs from each payment-group
        const workerIdSet = new Set<string>();
        for (const pgId of paymentGroupIds) {
          const pgSnap = await db.doc(`paymentGroups/${pgId}`).get();
          if (!pgSnap.exists) {
            logger.warn(`[payment-group] Group ${pgId} not found`);
            continue;
          }
          const pgData = pgSnap.data() as { workerIds: string[] };
          if (Array.isArray(pgData.workerIds)) {
            pgData.workerIds.forEach((wid) => workerIdSet.add(wid));
          }
        }
        const allWorkerIds = Array.from(workerIdSet);
        if (allWorkerIds.length === 0) {
          logger.warn(
            `[payment-group] No worker IDs found in groups on TX ${event.params.txId}`
          );
        }

        // 3b) Update the transaction document’s workerIds field
        await snap.ref.update({ workerIds: allWorkerIds });

        // 3c) Update each worker’s balance
        for (const workerId of allWorkerIds) {
          await updateWorkerBalance(workerId);
        }
        break;
      }

      default: {
        logger.warn(
          `Unknown function "${transactionFunction}" on TX ${event.params.txId}`
        );
        return;
      }
    }
  }
);
