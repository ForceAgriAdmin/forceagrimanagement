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
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { OperationModel } from '../models/operations/operation';

@Injectable({
  providedIn: 'root'
})
export class OperationService {
  constructor(private firestore: Firestore, private injector: Injector) {}

  getOperations(): Observable<OperationModel[]> {
    return runInInjectionContext(this.injector, () => {
      const operationsCollection = collection(this.firestore, 'operations');
      return collectionData(operationsCollection, { idField: 'id' }) as Observable<OperationModel[]>;
    });
  }

  getOperation(id: string): Observable<OperationModel | undefined> {
    return runInInjectionContext(this.injector, () => {
      const operationDoc = doc(this.firestore, `operations/${id}`);
      return docData(operationDoc, { idField: 'id' }) as Observable<OperationModel>;
    });
  }

  // addOperation(operation: Omit<OperationModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  //   const operationsCollection = collection(this.firestore, 'operations');
  //   const operationDocRef = doc(operationsCollection);
  //   const id = operationDocRef.id;
    
  //   const newOperation: OperationModel = {
  //     id,
  //     ...operation,
  //     createdAt: serverTimestamp() as any,
  //     updatedAt: serverTimestamp() as any,
  //   };
    
  //   return setDoc(operationDocRef, newOperation);
  // }

   addOperation(
    operation: Omit<OperationModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<OperationModel> {
    const col = collection(this.firestore, 'operations');
    const ref = doc(col);
    const id = ref.id;
    const newOp: OperationModel = {
      id,
      ...operation,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };
    return setDoc(ref, newOp).then(() => newOp);
  }

  updateOperation(
    op: Partial<OperationModel> & { id: string }
  ): Promise<void> {
    const ref = doc(this.firestore, `operations/${op.id}`);
    return updateDoc(ref, {
      ...op,
      updatedAt: serverTimestamp() as any
    });
  }
  // updateOperation(operation: Partial<OperationModel> & { id: string }): Promise<void> {
  //   const operationDoc = doc(this.firestore, `operations/${operation.id}`);
  //   const updateData = {
  //     ...operation,
  //     updatedAt: serverTimestamp() as any
  //   };
  //   return updateDoc(operationDoc, updateData);
  // }

  deleteOperation(id: string): Promise<void> {
    const operationDoc = doc(this.firestore, `operations/${id}`);
    return deleteDoc(operationDoc);
  }
}
