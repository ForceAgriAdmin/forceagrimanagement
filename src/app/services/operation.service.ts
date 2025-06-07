// src/app/services/operation.service.ts

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
  serverTimestamp
} from '@angular/fire/firestore';

import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL
} from '@angular/fire/storage';

import { Observable } from 'rxjs';
import { OperationModel } from '../models/operations/operation';

@Injectable({
  providedIn: 'root'
})
export class OperationService {
  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  /**
   * Return an Observable that emits all OperationModel[] in the 'operations' collection.
   */
  getOperations(): Observable<OperationModel[]> {
    const opsCol = collection(this.firestore, 'operations');
    return collectionData(opsCol, { idField: 'id' }) as Observable<OperationModel[]>;
  }

  /**
   * Return an Observable that emits a single OperationModel by ID.
   */
  getOperation(id: string): Observable<OperationModel | undefined> {
    const opDoc = doc(this.firestore, `operations/${id}`);
    return docData(opDoc, { idField: 'id' }) as Observable<OperationModel>;
  }

  /**
   * Upload a File to Firebase Storage under "operationProfiles/" and return its download URL.
   */
  async uploadProfileImage(file: File): Promise<string> {
    const timestamp = Date.now();
    const filePath = `operationProfiles/${timestamp}_${file.name}`;
    const storageRef = ref(this.storage, filePath);

    // Upload the raw bytes
    await uploadBytes(storageRef, file);

    // Get and return the publicly accessible URL
    return getDownloadURL(storageRef);
  }

  /**
   * Add a new Operation document. Returns a Promise that resolves to the newly created OperationModel.
   */
  addOperation(
    operation: Omit<OperationModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<OperationModel> {
    const opsCol = collection(this.firestore, 'operations');
    const newDocRef = doc(opsCol);
    const id = newDocRef.id;

    const newOp: OperationModel = {
      id,
      ...operation,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    return setDoc(newDocRef, newOp).then(() => newOp);
  }

  /**
   * Update an existing Operation document by ID. Provided fields in `op` are merged;
   * updatedAt is always set to serverTimestamp().
   */
  updateOperation(
    op: Partial<OperationModel> & { id: string }
  ): Promise<void> {
    const opDoc = doc(this.firestore, `operations/${op.id}`);
    return updateDoc(opDoc, {
      ...op,
      updatedAt: serverTimestamp() as any
    });
  }

  /**
   * Delete an Operation by its ID.
   */
  deleteOperation(id: string): Promise<void> {
    const opDoc = doc(this.firestore, `operations/${id}`);
    return deleteDoc(opDoc);
  }
}
