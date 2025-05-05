import { Injectable } from '@angular/core';
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
  getDocs,
  query,
  where,
  getDoc,
  addDoc,
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { TransactionModel } from '../models/transactions/transaction';
import { TransactionTypeModel } from '../models/transactions/transactiontype';

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {

  constructor(private firestore: Firestore) {}

  //private transactionsCollection = collection(this.firestore, 'transactions');
  //private typesCollection = collection(this.firestore, 'transactionTypes');

  // --- Transaction CRUD ---

  createTransaction(transaction: TransactionModel): Promise<void> {
    const transactionsCol = collection(this.firestore, 'transactions');
    return addDoc(transactionsCol, transaction).then(() => {});
  }

  getTransactionById(id: string): Observable<TransactionModel & { id: string }> {
    const ref = doc(this.firestore, `transactions/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<TransactionModel & { id: string }>;
  }

  getTransactions(): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    return collectionData(transactionsCol, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>;
  }

  updateTransaction(id: string, data: Partial<TransactionModel>): Promise<void> {
    const ref = doc(this.firestore, `transactions/${id}`);
    return updateDoc(ref, data);
  }

  deleteTransaction(id: string): Promise<void> {
    const ref = doc(this.firestore, `transactions/${id}`);
    return deleteDoc(ref);
  }

  // --- TransactionType CRUD ---

  createTransactionType(type: TransactionTypeModel): Promise<void> {
    const typesCol = collection(this.firestore, 'transactionTypes');
    return addDoc(typesCol, type).then(() => {});
  }

  getTransactionTypeById(id: string): Observable<TransactionTypeModel & { id: string }> {
    const ref = doc(this.firestore, `transactionTypes/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<TransactionTypeModel & { id: string }>;
  }

  getTransactionTypes(): Observable<(TransactionTypeModel & { id: string })[]> {
    const typesCol = collection(this.firestore, 'transactionTypes');
    return collectionData(typesCol, { idField: 'id' }) as Observable<(TransactionTypeModel & { id: string })[]>;
  }

  updateTransactionType(id: string, data: Partial<TransactionTypeModel>): Promise<void> {
    const ref = doc(this.firestore, `transactionTypes/${id}`);
    return updateDoc(ref, data);
  }

  deleteTransactionType(id: string): Promise<void> {
    const ref = doc(this.firestore, `transactionTypes/${id}`);
    return deleteDoc(ref);
  }

  // --- Query Helpers ---

  getTransactionsByWorkerId(workerId: string): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('workerId', '==', workerId),
      orderBy('timestamp', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>;
  }

  getTransactionsByTransactionTypeId(typeId: string): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('transactionTypeId', '==', typeId),
      orderBy('timestamp', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>;
  }

  getTransactionsByOperationId(operationId: string): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('operationId', '==', operationId),
      orderBy('timestamp', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>;
  }

  getTransactionsBetweenDates(start: Date, end: Date): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>;
  }

  getTransactionsBetweenDatesForWorkerId(
    workerId: string,
    start: Date,
    end: Date
  ): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('workerId', '==', workerId),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>;
  }

  getTransactionsBetweenDatesForOperationId(
    operationId: string,
    start: Date,
    end: Date
  ): Observable<(TransactionModel & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'transactions');
    const q = query(
      transactionsCol,
      where('operationId', '==', operationId),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>;
  }

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
    return collectionData(q, { idField: 'id' }) as Observable<(TransactionModel & { id: string })[]>;
  }
}

