import * as admin from "firebase-admin";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
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

    const {
      transactionTypeId,
      workerId,
      multiWorkerIds,
      amount: rawAmount,
      function: transactionFunction,
    } = txData;

    // 1) load the TransactionType
    const typeRef = db.doc(
      `transactionTypes/${transactionTypeId}`,
    );
    const typeSnap = await typeRef.get();
    if (!typeSnap.exists) {
      logger.error(
        `TransactionType ${transactionTypeId} not found`,
      );
      return;
    }
    const typeData = typeSnap.data();
    if (!typeData) {
      logger.error(
        "TransactionType data undefined for " +
        `${transactionTypeId}`,
      );
      return;
    }

    // 2) branch on operation mode
    switch (transactionFunction) {
    case "single": {
      let delta = rawAmount as number;
      if (typeData.isCredit) {
        delta = -Math.abs(delta);
        await snap.ref.update({amount: delta});
        logger.log(`[single] Flipped credit → ${delta}`);
      }
      if (!workerId) {
        logger.error(
          "[single] Missing workerId on TX " +
            `${event.params.txId}`,
        );
        return;
      }
      await db
        .doc(`workers/${workerId}`)
        .update({
          currentBalance: admin
            .firestore.FieldValue.increment(delta),
        });
      logger.log(
        `[single] Applied TX ${event.params.txId}: ` +
          `${delta} → worker ${workerId}`,
      );
      break;
    }

    case "bulk": {
      if (
        !Array.isArray(multiWorkerIds) ||
          multiWorkerIds.length === 0
      ) {
        logger.error(
          "[bulk] multiWorkerIds missing or empty " +
            `on TX ${event.params.txId}`,
        );
        return;
      }
      let delta = rawAmount as number;
      if (typeData.isCredit) {
        delta = -Math.abs(delta);
        await snap.ref.update({amount: delta});
        logger.log(`[bulk] Flipped credit → ${delta}`);
      }
      for (const id of multiWorkerIds) {
        await db
          .doc(`workers/${id}`)
          .update({
            currentBalance: admin
              .firestore.FieldValue.increment(delta),
          });
        logger.log(
          `[bulk] Applied TX ${event.params.txId}: ` +
            `${delta} → worker ${id}`,
        );
      }
      break;
    }

    case "payment-group": {
      logger.log(
        `[payment-group] TX ${event.params.txId} ` +
          "deferred to group logic",
      );
      break;
    }

    default:
      logger.warn(
        `Unknown function "${transactionFunction}" ` +
          `on TX ${event.params.txId}`,
      );
      return;
    }
  },
);
