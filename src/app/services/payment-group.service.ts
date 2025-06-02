import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, defer, from } from 'rxjs';
import { PaymentGroupRecord } from '../models/payment-groups/payment-group-record';



@Injectable({ providedIn: 'root' })
export class PaymentGroupService {
  constructor(
    private firestore: Firestore,
    private injector: Injector
  ) {}

  getGroups(): Observable<PaymentGroupRecord[]> {
    const col = collection(this.firestore, 'paymentGroups');
    return defer(() =>
      runInInjectionContext(this.injector, () =>
        collectionData(col, { idField: 'id' }) as Observable<
          PaymentGroupRecord[]
        >
      )
    );
  }

  createGroup(data: {
    description: string;
    workerIds: string[];
  }): Observable<PaymentGroupRecord> {
    return new Observable(observer => {
      const col = collection(this.firestore, 'paymentGroups');
      const docRef = doc(col);
      setDoc(docRef, {
        description: data.description,
        workerIds: data.workerIds,
        createdAt: Timestamp.now()
      })
        .then(() => {
          observer.next({
            id: docRef.id,
            description: data.description,
            workerIds: data.workerIds,
            createdAt: Timestamp.now()
          });
          observer.complete();
        })
        .catch(err => observer.error(err));
    });
  }

  editGroup(
    id: string,
    data: { description: string; workerIds: string[] }
  ): Observable<void> {
    const ref = doc(this.firestore, `paymentGroups/${id}`);
    return from(
      updateDoc(ref, {
        description: data.description,
        workerIds: data.workerIds,
        updatedAt: serverTimestamp()
      })
    );
  }

  deleteGroup(id: string): Observable<void> {
    const ref = doc(this.firestore, `paymentGroups/${id}`);
    return from(deleteDoc(ref));
  }
}
