import * as admin from "firebase-admin";
import axios from "axios";
import * as https from "https";
import { onDocumentCreated,onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();
const rekognitionApiBase = defineString('REKOGNITION_API_BASE');
const rekognitionAuthBucket = defineString('REKOGNITION_AUTH_BUCKET');
const rekognitionRegisteredBucket = defineString('REKOGNITION_REGISTERED_BUCKET');
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function uploadToAws(fileBuffer: Buffer, filename: string, bucket: string, mimeType: string): Promise<void> {
  const uploadUrl = `${rekognitionApiBase.value()}/${bucket}/${filename}`;
  await axios.put(uploadUrl, fileBuffer, {
    headers: {
      'Content-Type': mimeType || 'application/octet-stream',
    },
    httpsAgent,
  });
}

async function runFacialRecognition(filename: string) {
  const requestFacialUrl = `${rekognitionApiBase.value()}/worker`;
  try {
    const res = await axios.get(requestFacialUrl, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      params: { objectKey: filename },
      httpsAgent,
    });
    return res.data;
  } catch (err: any) {
    const status = err.response?.status;
    const message = err.response?.data?.message?.toLowerCase() || '';

    if (status === 403 || (status === 404 && !message)) {
      return { Message: 'no_match' };
    }

    if (status === 400 && message.includes('no faces')) {
      return { Message: 'no_face_detected' };
    }

    console.error('Unhandled Rekognition error', {
      status,
      message,
      details: err.message,
    });

    throw new functions.https.HttpsError('internal', 'Rekognition request failed');
  }
}

export const pingWorkerFacialRecognition = functions.https.onCall(async (data, context) => {
  const { fileUrl, filename, mimeType } = data;
  if (!fileUrl || !filename) {
    throw new functions.https.HttpsError('invalid-argument', 'fileUrl and filename are required');
  }

  try {
    const fileResp = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    await uploadToAws(Buffer.from(fileResp.data), filename, rekognitionAuthBucket.value(), mimeType);
    return await runFacialRecognition(filename);
  } catch (error: any) {
    console.error('Error in pingWorkerFacialRecognition:', error.message);
    throw new functions.https.HttpsError('internal', 'Ping failed');
  }
});

export const registerWorkerFacialRecognition = functions.https.onCall(async (data, context) => {
  const { fileUrl, filename, mimeType } = data;
  if (!fileUrl || !filename) {
    throw new functions.https.HttpsError('invalid-argument', 'fileUrl and filename are required');
  }

  try {
    const fileResp = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    await uploadToAws(Buffer.from(fileResp.data), filename, rekognitionRegisteredBucket.value(), mimeType);
    return await runFacialRecognition(filename);
  } catch (error: any) {
    console.error('Error in registerWorkerFacialRecognition:', error.message);
    throw new functions.https.HttpsError('internal', 'Registration failed');
  }
});
export const onTransactionUpdated = onDocumentUpdated(
  "transactions/{txId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) {
      logger.error("Missing before/after data in transaction update");
      return;
    }

    const txId = event.params.txId;

    const changed =
      before.amount !== after.amount ||
      before.function !== after.function ||
      JSON.stringify(before.workerIds) !== JSON.stringify(after.workerIds) ||
      before.transactionTypeId !== after.transactionTypeId;

    if (!changed) {
      logger.log(`TX ${txId} updated but not relevant to balance`);
      return;
    }

    const [oldTypeSnap, newTypeSnap] = await Promise.all([
      db.collection("transactionTypes").doc(before.transactionTypeId).get(),
      db.collection("transactionTypes").doc(after.transactionTypeId).get(),
    ]);

    if (!oldTypeSnap.exists || !newTypeSnap.exists) {
      logger.error("Missing transactionType(s) in update handler");
      return;
    }

    const oldType = oldTypeSnap.data() as { isCredit: boolean };
    const newType = newTypeSnap.data() as { isCredit: boolean };

    const oldDelta = (oldType.isCredit ? -1 : 1) * Math.abs(before.amount);
    const newDelta = (newType.isCredit ? -1 : 1) * Math.abs(after.amount);

    const oldWorkerIds: string[] = before.workerIds || [];
    const newWorkerIds: string[] = after.workerIds || [];

    const workerUpdates: Record<string, number> = {};

    for (const wid of oldWorkerIds) {
      workerUpdates[wid] = (workerUpdates[wid] || 0) - oldDelta;
    }

    for (const wid of newWorkerIds) {
      workerUpdates[wid] = (workerUpdates[wid] || 0) + newDelta;
    }

    await Promise.all(
      Object.entries(workerUpdates).map(async ([wid, delta]) => {
        await db.collection("workers").doc(wid).update({
          currentBalance: FieldValue.increment(delta),
        });
        logger.log(
          `TX ${txId}: Adjusted ${wid} by ${delta > 0 ? '+' : ''}${delta}`
        );
      })
    );

    logger.log(`TX ${txId} balance updates completed.`);
  }
);
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

export const onWorkerAdded = onDocumentCreated('workers/{workerId}', async (event) => {
  const snap = event.data;
  if (!snap) {
    logger.error('No document snapshot found.');
    return;
  }

  const workerRef = snap.ref;
  const counterRef = db.collection('counters').doc('employeeNumberCounter');

  try {
    await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      if (counterDoc.exists) {
         let current = counterDoc.data()?.current;

         const nextWorkerNumber = current + 1;

          transaction.set(counterRef, { current: nextWorkerNumber });

          transaction.update(workerRef, {
            employeeNumber: `${nextWorkerNumber}`,
          });
      }
      logger.info(`Assigned worker number successfully.`);
    });
  } catch (error) {
    logger.error('Failed to assign worker number:', error);
  }
});