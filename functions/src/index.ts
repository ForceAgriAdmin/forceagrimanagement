import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

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

    // alias your reserved-word field:
    const {
      transactionTypeId,
      workerId,
      multiWorkerId,
      amount: rawAmount,
      function: transactionFunction,
      // future: groupId?
    } = txData;

    // 1) Load TransactionType once
    const typeRef  = db.doc(`transactionTypes/${transactionTypeId}`);
    const typeSnap = await typeRef.get();
    if (!typeSnap.exists) {
      logger.error(`TransactionType ${transactionTypeId} not found`);
      return;
    }
    const typeData = typeSnap.data();
    if (!typeData) {
      logger.error(
        `TransactionType data undefined for ${transactionTypeId}`
      );
      return;
    }

    // 2) Branch on operation mode
    switch (transactionFunction) {
      case "single": {
        // — Single: exactly as before —
        let delta = rawAmount as number;
        if (typeData.isCredit) {
          delta = -Math.abs(delta);
          await snap.ref.update({ amount: delta });
          logger.log(`[single] Flipped credit → ${delta}`);
        }
        if (!workerId) {
          logger.error(`[single] Missing workerId on TX ${event.params.txId}`);
          return;
        }
        await db
          .doc(`workers/${workerId}`)
          .update({
            currentBalance:
              admin.firestore.FieldValue.increment(delta),
          });
        logger.log(
          `[single] Applied TX ${event.params.txId}: ${delta} → worker ${workerId}`
        );
        break;
      }

      case "bulk": {
        // — Bulk: apply single logic for each ID in multiWorkerId —
        if (
          !Array.isArray(multiWorkerId) ||
          multiWorkerId.length === 0
        ) {
          logger.error(
            `[bulk] multiWorkerId missing or empty on TX ${event.params.txId}`
          );
          return;
        }

        let delta = rawAmount as number;
        if (typeData.isCredit) {
          delta = -Math.abs(delta);
          await snap.ref.update({ amount: delta });
          logger.log(`[bulk] Flipped credit → ${delta}`);
        }

        // loop through all specified workers
        for (const id of multiWorkerId) {
          await db
            .doc(`workers/${id}`)
            .update({
              currentBalance:
                admin.firestore.FieldValue.increment(delta),
            });
          logger.log(
            `[bulk] Applied TX ${event.params.txId}: ${delta} → worker ${id}`
          );
        }
        break;
      }

      case "payment-group": {
        // — Payment‐Group stub —
        logger.log(
          `[payment-group] TX ${event.params.txId} deferred to group logic`
        );
        // TODO: add groupId → load members → update balances
        break;
      }

      default:
        logger.warn(
          `Unknown function "${transactionFunction}" on TX ${event.params.txId}`
        );
        return;
    }
  }
);
