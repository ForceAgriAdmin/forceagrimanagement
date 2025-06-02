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
  orderBy
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { TransactionModel } from '../models/transactions/transaction';
import { TransactionTypeModel } from '../models/transactions/transactiontype';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  constructor(
    private firestore: Firestore,
    private injector: Injector
  ) {}

  // ─── Transaction CRUD ─────────────────────────────────────────────────

  /** Create a new transaction */
  createTransaction(transaction: TransactionModel): Promise<void> {
    const transactionsCol = collection(this.firestore, 'transactions');
    return addDoc(transactionsCol, transaction).then(() => {});
  }

  /** Get a single transaction by its document ID */
  getTransactionById(
    id: string
  ): Observable<TransactionModel & { id: string }> {
    const ref = doc(this.firestore, `transactions/${id}`);
    // wrap docData(...) inside runInInjectionContext
    return runInInjectionContext(
      this.injector,
      () => docData(ref, { idField: 'id' }) as Observable<TransactionModel & { id: string }>
    );
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
}
