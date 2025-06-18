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
  getDoc,
  Timestamp,
  orderBy,
  writeBatch
} from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { catchError, forkJoin, from, map, Observable, of, tap, throwError } from 'rxjs';
import { WorkerModel } from '../models/workers/worker';
import { IdentityCard } from '../models/workers/identitycard';
import { WorkerTypeModel } from '../models/workers/worker-type';
import { TimelineEvent } from '../models/workers/timelineevent';

// Simple in-memory cache for image URLs
interface ImageCacheEntry {
  url: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class WorkersService {
  private imageCache = new Map<string, ImageCacheEntry>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(
    private firestore: Firestore,
    private injector: Injector,
    private zone: NgZone
  ) {}

  /**
   * Return a cached download URL for 30 minutes.
   * Accepts either a full URL or a storage path.
   */
  getProfileImageUrl(pathOrUrl: string): Observable<string> {
    const now = Date.now();
    const cached = this.imageCache.get(pathOrUrl);
    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return of(cached.url);
    }

    let url$: Observable<string>;
    if (pathOrUrl.startsWith('http')) {
      url$ = of(pathOrUrl);
    } else {
      const storage = getStorage();
      const storageRef = ref(storage, pathOrUrl);
      url$ = from(getDownloadURL(storageRef));
    }

    return url$.pipe(
      tap(url => this.imageCache.set(pathOrUrl, { url, timestamp: now }))
    );
  }

  /** Create a new worker and immediately issue a card */
  async addWorker(
    worker: Omit<WorkerModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
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
    });
  }

  getWorkerCard(workerId: string): Observable<IdentityCard | undefined> {
    return runInInjectionContext(this.injector, () => {
      const cardsCol = collection(this.firestore, 'cards');
      const q = query(
        cardsCol,
        where('workerId', '==', workerId)
        //where('active', '==', true)
      );
      return collectionData(q, { idField: 'id' }) as Observable<IdentityCard[]>;
    }).pipe(
      map(cards => cards.length ? cards[0] : undefined)
    );
  }

  /** Update a worker; if operationId or farmId changed, issue a new card */
  async updateWorker(
    worker: Partial<WorkerModel> & { id: string }
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const workerRef = doc(this.firestore, `workers/${worker.id}`);
      const snap = await getDoc(workerRef);

      if (!snap.exists()) {
        throw new Error('Worker not found');
      }

      const existing = snap.data() as WorkerModel;
      const newOp = worker.operationId ?? existing.operationId;
      const newFarm = worker.farmId ?? existing.farmId;

      if (newOp !== existing.operationId || newFarm !== existing.farmId) {
        await this.issueCard(worker.id);
      }

      await updateDoc(workerRef, {
        ...worker,
        updatedAt: serverTimestamp() as any
      });
    });
  }

  public async cancelAllWorkerCards(workerId: string): Promise<void> {
  const cardsCol = collection(this.firestore, 'cards');
  const q = query(cardsCol, where('workerId', '==', workerId));
  const snapshots = await getDocs(q);

  const batch = writeBatch(this.firestore);
  snapshots.docs.forEach(ds => {
    const cardRef = doc(this.firestore, 'cards', ds.id);
    batch.update(cardRef, { active: false });
  });
  await batch.commit();
}

  /** Deactivate all cards for this worker, then create a new one */
  private async issueCard(workerId: string): Promise<void> {
    const cardsCol = collection(this.firestore, 'cards');
    const q = query(cardsCol, where('workerId', '==', workerId));
    const snapshots = await getDocs(q);
    for (const ds of snapshots.docs) {
      const cardRef = doc(this.firestore, 'cards', ds.id);
      await updateDoc(cardRef, { active: false });
    }

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
    const q = query(colRef/*, where('isActive', '==', true)*/);
    return collectionData(q, { idField: 'id' }) as Observable<WorkerModel[]>;
  });
}

 getWorkersById(ids: string[]): Observable<WorkerModel[]> {
    return runInInjectionContext(this.injector, () => {
      const observables = ids.map(id => {
        const docRef = doc(this.firestore, `workers/${id}`);
        return from(getDoc(docRef)).pipe(
          map(snapshot => {
            if (!snapshot.exists()) {
              return null as unknown as WorkerModel;
            }
            const data = snapshot.data() as Omit<WorkerModel, 'id'>;
            return { ...data, id: snapshot.id };
          })
        );
      });
      return forkJoin(observables).pipe(
        map(results => results.filter(w => w !== null) as WorkerModel[])
      );
    });
  }

 getWorker(id: string): Observable<WorkerModel> {
    return runInInjectionContext(this.injector, () => {
      const docRef = doc(this.firestore, `workers/${id}`);
      return from(getDoc(docRef)).pipe(
        map((snap) => {
          if (!snap.exists()) {
            throw new Error(`Worker ${id} does not exist`);
          }
          const data = snap.data() as Omit<WorkerModel, "id">;
          return { ...data, id: snap.id };
        }),
        catchError((err) => {
          return throwError(() => new Error(err.message || err));
        })
      );
    });
  }

  deleteWorker(id: string): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const docRef = doc(this.firestore, `workers/${id}`);
      return deleteDoc(docRef);
    });
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

  /** Fetch all worker types */
  getWorkerTypes(): Observable<WorkerTypeModel[]> {
    return runInInjectionContext(this.injector, () => {
      const col = collection(this.firestore, 'workerTypes');
      return collectionData(col, { idField: 'id' }) as Observable<WorkerTypeModel[]>;
    });
  }

  /** Create a new worker type */
  createWorkerType(description: string): Observable<WorkerTypeModel> {
    return new Observable(observer => {
      const col = collection(this.firestore, 'workerTypes');
      const ref = doc(col);
      setDoc(ref, {
        description,
        createdAt: serverTimestamp()
      })
        .then(() => {
          observer.next({ id: ref.id, description });
          observer.complete();
        })
        .catch(err => observer.error(err));
    });
  }

  createWorkerTimelineEvent(event: Omit<TimelineEvent, 'id'>): Observable<TimelineEvent> {
  return new Observable(observer => {
    const col = collection(this.firestore, 'timelineEvents');
    const ref = doc(col);
    const firestoreEvent = {
      workerId: event.workerId,
      title: event.title,
      actionDate: event.actionDate,
      description: event.description,
      icon: event.icon
    };

    setDoc(ref, firestoreEvent)
      .then(() => {
        observer.next({
          id: ref.id,
          workerId: event.workerId,
          title: event.title,
          actionDate: event.actionDate,
          description: event.description,
          icon: event.icon
        });
        observer.complete();
      })
      .catch(err => observer.error(err));
  });
}

getTimelineEventsByWorkerId(
    workerId: string
  ): Observable<(TimelineEvent & { id: string })[]> {
    const transactionsCol = collection(this.firestore, 'timelineEvents');
    const q = query(
      transactionsCol,
      where('workerId', '==', workerId),
      orderBy('actionDate', 'desc')
    );
    return runInInjectionContext(
      this.injector,
      () => collectionData(q, { idField: 'id' }) as Observable<(TimelineEvent & { id: string })[]>
    );
  }

  /** Update an existing worker type */
  updateWorkerType(id: string, description: string): Observable<void> {
    const ref = doc(this.firestore, `workerTypes/${id}`);
    return from(
      updateDoc(ref, {
        description,
        updatedAt: serverTimestamp()
      })
    );
  }

  /** Delete a worker type */
  deleteWorkerType(id: string): Observable<void> {
    const ref = doc(this.firestore, `workerTypes/${id}`);
    return from(deleteDoc(ref));
  }



  
}