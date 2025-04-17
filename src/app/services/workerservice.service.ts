import { Injectable, Injector, NgZone, runInInjectionContext } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc, serverTimestamp } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { WorkerModel } from '../models/workers/worker';

@Injectable({
  providedIn: 'root'
})
export class WorkersService {
  constructor(private firestore: Firestore, private injector: Injector, private zone: NgZone) {}

  addWorker(worker: Omit<WorkerModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const workersCollection = collection(this.firestore, 'workers');
    const workerDocRef = doc(workersCollection);
    const id = workerDocRef.id;
    
    const newWorker: WorkerModel = {
      id,
      ...worker,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    return setDoc(workerDocRef, newWorker);
  }

  getWorkers(): Observable<WorkerModel[]> {
    return runInInjectionContext(this.injector, () => {
      const workersCollection = collection(this.firestore, 'workers');
      return collectionData(workersCollection, { idField: 'id' }) as Observable<WorkerModel[]>;
    });
  }

  getWorker(id: string): Observable<WorkerModel | undefined> {
    return runInInjectionContext(this.injector, () => {
      const workerDocRef = doc(this.firestore, `workers/${id}`);
      return docData(workerDocRef, { idField: 'id' }) as Observable<WorkerModel>;
    });
  }

  updateWorker(worker: Partial<WorkerModel> & { id: string }): Promise<void> {
    const workerDocRef = doc(this.firestore, `workers/${worker.id}`);
    const updateData = {
      ...worker,
      updatedAt: serverTimestamp() as any
    };
    return updateDoc(workerDocRef, updateData);
  }

  deleteWorker(id: string): Promise<void> {
    const workerDocRef = doc(this.firestore, `workers/${id}`);
    return deleteDoc(workerDocRef);
  }

  uploadProfileImage(file: File): Promise<string> {
    return runInInjectionContext(this.injector, () => {
      const storage = getStorage();
      const filePath = `profiles/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      return uploadBytes(storageRef, file).then(snapshot => 
        this.zone.run(() => getDownloadURL(snapshot.ref))
      );
    });
  }
}
