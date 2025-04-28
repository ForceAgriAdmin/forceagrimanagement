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
import { FarmModel } from '../models/farms/farm';

@Injectable({
  providedIn: 'root'
})
export class FarmService {
  constructor(private firestore: Firestore, private injector: Injector) {}

  getFarms(): Observable<FarmModel[]> {
    return runInInjectionContext(this.injector, () => {
      const col = collection(this.firestore, 'farms');
      return collectionData(col, { idField: 'id' }) as Observable<FarmModel[]>;
    });
  }

  getFarm(id: string): Observable<FarmModel> {
    return runInInjectionContext(this.injector, () => {
      const d = doc(this.firestore, `farms/${id}`);
      return docData(d, { idField: 'id' }) as Observable<FarmModel>;
    });
  }

  addFarm(farm: Omit<FarmModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const col = collection(this.firestore, 'farms');
    const ref = doc(col);
    const newFarm: FarmModel = {
      id: ref.id,
      ...farm,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };
    return setDoc(ref, newFarm);
  }

  updateFarm(farm: Partial<FarmModel> & { id: string }): Promise<void> {
    const ref = doc(this.firestore, `farms/${farm.id}`);
    return updateDoc(ref, {
      ...farm,
      updatedAt: serverTimestamp() as any
    });
  }

  deleteFarm(id: string): Promise<void> {
    const ref = doc(this.firestore, `farms/${id}`);
    return deleteDoc(ref);
  }
}
