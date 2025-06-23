// src/app/services/transactions.service.ts

import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  getFirestore,
  writeBatch
} from '@angular/fire/firestore';
import { firstValueFrom, from, Observable } from 'rxjs';
import { TransactionModel } from '../models/transactions/transaction';
import { TransactionTypeModel } from '../models/transactions/transactiontype';
import { WorkerModel } from '../models/workers/worker';
import { WorkersService } from './workerservice.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  constructor(
    private firestore: Firestore,
    private injector: Injector,
    private workerService: WorkersService
  ) {}

  // ─── Transaction CRUD ─────────────────────────────────────────────────

  /** Create a new transaction */
  async createTransaction(transaction: TransactionModel): Promise<string> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const docRef = await addDoc(transactionsCol, transaction);
    return docRef.id;
  }

  /** Get a single transaction by its document ID */
   getTransactionById(
    id: string
  ): Observable<TransactionModel & { id: string }> {
    const ref = doc(this.firestore, `transactions/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<TransactionModel & { id: string }>;
  }

  /** Get all transactions (no filtering) */
  getTransactions(): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    return runInInjectionContext(
      this.injector,
      () => collectionData(transactionsCol, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>
    );
  }

  /** Update an existing transaction by ID */
  updateTransaction(
    id: string,
    data: Partial<TransactionModel>
  ): Promise<void> {
    const ref = doc(this.firestore, `transactions/${id}`);
    return updateDoc(ref, data);
  }

  /** Delete a transaction by ID */
  deleteTransaction(id: string): Promise<void> {
    const ref = doc(this.firestore, `transactions/${id}`);
    return deleteDoc(ref);
  }

  // ─── TransactionType CRUD ───────────────────────────────────────────────

  /** Get all transaction types */
  getTransactionTypes(): Observable<(TransactionTypeModel & { id: string })[]> {
    const typesCol = collection(this.firestore, 'transactionTypes');
    return runInInjectionContext(
      this.injector,
      () => collectionData(typesCol, { idField: 'id' }) as Observable<(TransactionTypeModel & { id: string })[]>
    );
  }

  /** Create a new transaction type */
  createTransactionType(data: {
    name: string;
    description: string;
    isCredit: boolean;
  }): Observable<void> {
    const typesCol = collection(this.firestore, 'transactionTypes');
    return from(
      setDoc(doc(typesCol), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );
  }

  /** Update an existing transaction type by ID */
  updateTransactionType(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      isCredit: boolean;
    }>
  ): Observable<void> {
    const ref = doc(this.firestore, `transactionTypes/${id}`);
    return from(
      updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
      })
    );
  }

  /** Delete a transaction type by ID */
  deleteTransactionType(id: string): Observable<void> {
    const ref = doc(this.firestore, `transactionTypes/${id}`);
    return from(deleteDoc(ref));
  }

  // ─── Query Helpers (using array-contains where appropriate) ──────────────

  /**
   * Fetch all transactions whose `workerIds` array contains the given `workerId`,
   * ordered by `timestamp` descending.
   */
  getTransactionsByWorkerId(
    workerId: string
  ): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('workerIds', 'array-contains', workerId),
      orderBy('timestamp', 'desc')
    );
    return runInInjectionContext(
      this.injector,
      () => collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>
    );
  }

  /**
   * Fetch all transactions whose `transactionTypeId` equals the given `typeId`,
   * ordered by `timestamp` descending.
   */
  getTransactionsByTransactionTypeId(
    typeId: string
  ): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('transactionTypeId', '==', typeId),
      orderBy('timestamp', 'desc')
    );
    return runInInjectionContext(
      this.injector,
      () => collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>
    );
  }

  /**
   * Fetch all transactions whose `operationIds` array contains the given `operationId`,
   * ordered by `timestamp` descending.
   */
  getTransactionsByOperationId(
    operationId: string
  ): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('operationIds', 'array-contains', operationId),
      orderBy('timestamp', 'desc')
    );
    return runInInjectionContext(
      this.injector,
      () => collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>
    );
  }

  /**
   * Fetch all transactions between `start` and `end` (inclusive),
   * ordered by `timestamp` ascending.
   */
  getTransactionsBetweenDates(
    start: Date,
    end: Date
  ): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'asc')
    );
    return runInInjectionContext(
      this.injector,
      () => collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>
    );
  }

  /**
   * Fetch all transactions between `start` and `end` (inclusive) for a given `workerId`
   * (using `array-contains` on `workerIds`), ordered by `timestamp` ascending.
   */
  getTransactionsBetweenDatesForWorkerId(
    workerId: string,
    start: Date,
    end: Date
  ): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('workerIds', 'array-contains', workerId),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'asc')
    );
    return runInInjectionContext(
      this.injector,
      () => collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>
    );
  }

  /**
   * Fetch all transactions between `start` and `end` (inclusive) for a given `operationId`
   * (using `array-contains` on `operationIds`), ordered by `timestamp` ascending.
   */
  getTransactionsBetweenDatesForOperationId(
    operationId: string,
    start: Date,
    end: Date
  ): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('operationIds', 'array-contains', operationId),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'asc')
    );
    return runInInjectionContext(
      this.injector,
      () => collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>
    );
  }

  /**
   * Fetch all transactions between `start` and `end` (inclusive) for a given `transactionTypeId`,
   * ordered by `timestamp` ascending.
   */
  getTransactionsBetweenDatesForTransactionTypeId(
    typeId: string,
    start: Date,
    end: Date
  ): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('transactionTypeId', '==', typeId),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'asc')
    );
    return runInInjectionContext(
      this.injector,
      () => collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>
    );
  }
getTransactionTypeById(
    typeId: string
  ): Observable<TransactionTypeModel & { id: string }> {
    const ref = doc(this.firestore, `transactionTypes/${typeId}`);
    return docData(ref, { idField: 'id' }) as Observable<
      TransactionTypeModel & { id: string }
    >;
  }


  
  
  async PrintTransactionSlip(tx: TransactionModel,worker: WorkerModel): Promise<void> {

    // const worker = await firstValueFrom(
    //   this.workerService.getWorker(tx.workerIds[0])
    // ) as WorkerModel;

    const typeRec = await firstValueFrom(
      this.getTransactionTypeById(tx.transactionTypeId)
    ) as TransactionTypeModel;
    
    

    let beforeBalance  = worker.currentBalance;
    let afterBalance = 0;
    let transactionAmount = 0.0;
    var isNegative = false;




    if (typeRec.isCredit) {
      afterBalance = beforeBalance - tx.amount;
      transactionAmount -= tx.amount;
      isNegative = true;
    }
    else 
    {
      afterBalance = beforeBalance + tx.amount;
      transactionAmount += tx.amount;
    }
    
    
    const displayAmount = isNegative ? `N$ -${Math.abs(transactionAmount).toFixed(2)}` : `N$ ${Math.abs(transactionAmount).toFixed(2)}`;
    

    const receiptHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Slip Receipt</title>
       <style>
  @page {
  size: 80mm auto;
  margin: 0;
}

body {
  margin: 0;
  padding: 0;
  font-family: "Courier New", Courier, monospace;
}

.receipt {
  width: 72mm;            /* slightly less than 80mm */
  padding: 4mm 5mm;       /* space on left & right */
  box-sizing: border-box;
}

.receipt-header {
  text-align: center;
  margin-bottom: 4mm;
}

.receipt-header h2 {
  margin: 0;
  font-size: 16pt;
}

.receipt-header p {
  margin: 1mm 0;
  font-size: 10pt;
  color: #555;
}

.divider {
  border-top: 1px dashed #999;
  margin: 4mm 0;
}

.field-row {
  display: flex;
  justify-content: space-between;
  font-size: 9pt;
  margin-bottom: 1.5mm;
}

.receipt-footer {
  text-align: center;
  margin-top: 4mm;
  font-size: 9pt;
  color: #777;
}

@media print {
  html, body {
    width: 80mm;
    margin: 0;
    padding: 0;
  }

  .receipt {
    width: 72mm;          /* maintain smaller width */
    padding: 4mm 5mm;
    box-shadow: none;
  }
}

</style>

      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <h2>Cruxhaven</h2>
            <p>PB Anebfarming</p>
            <p>PO BOX 123</p>
            <div class="divider"></div>
          </div>

          <!-- Worker Info -->
          <div class="field-row">
            <span class="label">Worker Name:</span>
            <span class="value">${worker.firstName} ${worker.lastName}</span>
          </div>
          <div class="field-row">
            <span class="label">Employee #:</span>
            <span class="value">${worker.employeeNumber}</span>
          </div>
          <div class="field-row">
            <span class="label">ID Number:</span>
            <span class="value">${worker.idNumber}</span>
          </div>
          <div class="field-row">
            <span class="label">Balance (Before):</span>
            <span class="value">N$${beforeBalance.toFixed(2)}</span>
          </div>
          <div class="divider"></div>

          <!-- Transaction Details -->
          <div class="field-row">
            <span class="label">Type:</span>
            <span class="value">${typeRec.name}</span>
          </div>
          <div class="field-row">
            <span class="label">Amount:</span>
            <span class="value">${displayAmount}</span>
          </div>
          <div class="field-row">
            <span class="label">Date:</span>
            <span class="value">${tx.timestamp.toDate().toLocaleDateString()}</span>
          </div>
          <div class="divider"></div>

          <!-- New Balance -->
          <div class="field-row">
            <span class="label"><strong>Current Balance:</strong></span>
            <span class="value"><strong>N$${afterBalance.toFixed(2)}</strong></span>
          </div>

          <div class="divider"></div>
          <div class="receipt-footer">
            Printed by www.forceagri.com
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Popup blocked – cannot print slip');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    
    printWindow.document.close();

    printWindow.print();
    printWindow.close();
    setTimeout(() => {
      
    }, 300);
  }

 async deleteTransactionsForWorker(
  targetId: string,
  db: Firestore = getFirestore()
): Promise<void> {
  const txCollection = collection(db, 'transactions');

  // Query 1: legacy single-worker field
  const q1 = query(txCollection, where('workerId', '==', targetId));

  // Query 2: new multi-worker array field
  const q2 = query(txCollection, where('workerIds', 'array-contains', targetId));

  // Fire both queries in parallel
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  // Start a batch delete
  const batch = writeBatch(db);

  // Add all matching docs to the batch
  for (const docSnap of [...snap1.docs, ...snap2.docs]) {
    batch.delete(docSnap.ref);
  }

  // Commit the batch (max ~500 operations per batch)
  await batch.commit();
}
}
