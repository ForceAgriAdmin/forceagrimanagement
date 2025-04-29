import { Injectable, Injector, NgZone, runInInjectionContext } from '@angular/core';
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
  getDoc
} from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { WorkerModel } from '../models/workers/worker';
import { IdentityCard } from '../models/workers/identitycard';

@Injectable({
  providedIn: 'root'
})
export class WorkersService {
  constructor(
    private firestore: Firestore,
    private injector: Injector,
    private zone: NgZone
  ) {}

  /** Create a new worker and immediately issue a card */
  async addWorker(
    worker: Omit<WorkerModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const workersCol = collection(this.firestore, 'workers');
    const workerRef = doc(workersCol);
    const id = workerRef.id;

    const newWorker: WorkerModel = {
      id,
      ...worker,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    await setDoc(workerRef, newWorker);
    await this.issueCard(id);
  }

  /** Update a worker; if operationId or farmId changed, issue a new card */
  async updateWorker(
    worker: Partial<WorkerModel> & { id: string }
  ): Promise<void> {
    const workerRef = doc(this.firestore, `workers/${worker.id}`);
    const snap = await getDoc(workerRef);

    if (!snap.exists()) {
      throw new Error('Worker not found');
    }

    const existing = snap.data() as WorkerModel;
    const newOp = worker.operationId ?? existing.operationId;
    const newFarm = worker.farmId ?? existing.farmId;

    // if either key field changed, deactivate old cards & issue a fresh one
    if (newOp !== existing.operationId || newFarm !== existing.farmId) {
      await this.issueCard(worker.id);
    }

    await updateDoc(workerRef, {
      ...worker,
      updatedAt: serverTimestamp() as any
    });
  }

  /** Deactivate all cards for this worker, then create a new one */
  private async issueCard(workerId: string): Promise<void> {
    const cardsCol = collection(this.firestore, 'cards');

    // deactivate existing
    const q = query(cardsCol, where('workerId', '==', workerId));
    const snapshots = await getDocs(q);
    for (const ds of snapshots.docs) {
      const cardRef = doc(this.firestore, 'cards', ds.id);
      await updateDoc(cardRef, { active: false });
    }

    // create new
    const newRef = doc(cardsCol);
    const newCard: IdentityCard = {
      id: newRef.id,
      workerId,
      active: true,
      number: this.createCardNumber(),
      createdAt: serverTimestamp() as any
    };
    await setDoc(newRef, newCard);
  }

  /** Simple timestamp + random to guarantee uniqueness */
  private createCardNumber(): string {
    const ts = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .slice(0, 12);
    const rnd = Math.floor(1e7 + Math.random() * 9e7).toString();
    return `${ts}${rnd}`;
  }

  getWorkers(): Observable<WorkerModel[]> {
    return runInInjectionContext(this.injector, () => {
      const colRef = collection(this.firestore, 'workers');
      return collectionData(colRef, { idField: 'id' }) as Observable<WorkerModel[]>;
    });
  }

  getWorker(id: string): Observable<WorkerModel> {
    return runInInjectionContext(this.injector, () => {
      const docRef = doc(this.firestore, `workers/${id}`);
      return docData(docRef, { idField: 'id' }) as Observable<WorkerModel>;
    });
  }

  deleteWorker(id: string): Promise<void> {
    const docRef = doc(this.firestore, `workers/${id}`);
    return deleteDoc(docRef);
  }

  uploadProfileImage(file: File): Promise<string> {
    return runInInjectionContext(this.injector, () => {
      const storage = getStorage();
      const path = `profiles/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      return uploadBytes(storageRef, file).then(snapshot =>
        this.zone.run(() => getDownloadURL(snapshot.ref))
      );
    });
  }
}
