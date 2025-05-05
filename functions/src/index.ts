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

    const {transactionTypeId, workerId, amount: rawAmount} = txData;
    let delta = rawAmount as number;

    // 1) load the TransactionType
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

    // 2) if credit, flip the sign and update the record
    if (typeData.isCredit) {
      delta = -Math.abs(delta);
      await snap.ref.update({amount: delta});
      logger.log(`Flipped credit to negative: ${delta}`);
    }

    // 3) atomically increment the worker’s balance
    await db
      .doc(`workers/${workerId}`)
      .update({
        currentBalance: admin.firestore.FieldValue.increment(delta),
      });

    logger.log(
      `Applied transaction ${event.params.txId}: ${delta} → worker ${workerId}`
    );
  }
);
