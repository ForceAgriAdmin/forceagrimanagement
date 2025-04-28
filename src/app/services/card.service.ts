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
  getDocs,
  query,
  where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { IdentityCard } from '../models/workers/identitycard';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  constructor(
    private firestore: Firestore,
    private injector: Injector
  ) {}

  getCards(): Observable<IdentityCard[]> {
    return runInInjectionContext(this.injector, () => {
      const cardsColl = collection(this.firestore, 'identitycards');
      return collectionData(cardsColl, { idField: 'id' }) as Observable<IdentityCard[]>;
    });
  }

  getCard(id: string): Observable<IdentityCard> {
    return runInInjectionContext(this.injector, () => {
      const cardDoc = doc(this.firestore, `identitycards/${id}`);
      return docData(cardDoc, { idField: 'id' }) as Observable<IdentityCard>;
    });
  }

  addCard(card: Omit<IdentityCard, 'createdAt'>): Promise<void> {
    const cardsColl = collection(this.firestore, 'identitycards');
    const cardRef = doc(cardsColl);
    const newCard: IdentityCard = {
      ...card,
      createdAt: serverTimestamp() as any
    };
    return setDoc(cardRef, newCard);
  }


  updateCard(id: string, changes: Partial<IdentityCard>): Promise<void> {
    const cardDoc = doc(this.firestore, `identitycards/${id}`);
    return updateDoc(cardDoc, changes);
  }

  deleteCard(id: string): Promise<void> {
    const cardDoc = doc(this.firestore, `identitycards/${id}`);
    return deleteDoc(cardDoc);
  }

  scanCard(cardNumber: string): Promise<string | false> {
    return runInInjectionContext(this.injector, async () => {
      const cardsColl = collection(this.firestore, 'identitycards');
      const q = query(cardsColl, where('number', '==', cardNumber));
      const snap = await getDocs(q);

      if (snap.empty) {
        return false;
      }

      const card = snap.docs[0].data() as IdentityCard;
      return card.active ? card.workerId : false;
    });
  }


  scanWorkerCard(cardNumber: string, workerId: string): Promise<boolean> {
    return runInInjectionContext(this.injector, async () => {
      const cardsColl = collection(this.firestore, 'identitycards');
      const q = query(cardsColl, where('number', '==', cardNumber));
      const snap = await getDocs(q);

      if (snap.empty) {
        return false;
      }

      const card = snap.docs[0].data() as IdentityCard;
      return card.active && card.workerId === workerId;
    });
  }
}
