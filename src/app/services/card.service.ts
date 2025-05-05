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
import { SupervisorCard } from '../models/users/supervisorcard';

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
      const cardsColl = collection(this.firestore, 'cards');
      return collectionData(cardsColl, { idField: 'id' }) as Observable<IdentityCard[]>;
    });
  }

  getCard(id: string): Observable<IdentityCard> {
    return runInInjectionContext(this.injector, () => {
      const cardDoc = doc(this.firestore, `cards/${id}`);
      return docData(cardDoc, { idField: 'id' }) as Observable<IdentityCard>;
    });
  }

  getWorkerCard(workerId: string): Promise<Observable<IdentityCard>> {
    return runInInjectionContext(this.injector, async () => {
      const cardsColl = collection(this.firestore, 'cards');
      const q = query(cardsColl, where('workerId', '==', workerId),where('active','==',true));
      const snap = await getDocs(q);

      if (snap.empty) {
        
      }

      const card = snap.docs[0].data() as IdentityCard;

      
      const cardDoc = doc(this.firestore, `cards/${card.id}`);
      return docData(cardDoc, { idField: 'id' }) as Observable<IdentityCard>;
    });
  }

  async addCard(card: Omit<IdentityCard, 'createdAt' | 'workerID' | 'active' | 'number'>,workerId: string): Promise<void> {
    const cardsColl = collection(this.firestore, 'cards');
    const cardRef = doc(cardsColl);

    //update all existing worker cards to active = false
    try
    {
      const q = query(cardsColl, where(workerId, '==', workerId));
      const snap = await getDocs(q);

      snap.forEach((documentSnapshot) => {
        const docRef = doc(this.firestore, 'cards', documentSnapshot.id);
        updateDoc(docRef, { active: false });
      });


      if (snap.empty) {
        return;
      }

    } catch (error) {
      return;
    }
    
    const newCard: IdentityCard = {
      ...card,
      workerId: workerId,
      active: true,
      number: this.createCardNumber(),
      createdAt: serverTimestamp() as any
    };


   
    return setDoc(cardRef, newCard);
  }

  async addSupervisorCard(card: Omit<SupervisorCard, 'createdAt' | 'userId' | 'active' | 'number'>,userId: string): Promise<void> {
    const cardsColl = collection(this.firestore, 'supervisorCards');
    const cardRef = doc(cardsColl);

    //update all existing worker cards to active = false
    try
    {
      const q = query(cardsColl, where(userId, '==', userId));
      const snap = await getDocs(q);

      snap.forEach((documentSnapshot) => {
        const docRef = doc(this.firestore, 'supervisorCards', documentSnapshot.id);
        updateDoc(docRef, { active: false });
      });


      if (snap.empty) {
        return;
      }

    } catch (error) {
      return;
    }
    
    const newCard: SupervisorCard = {
      ...card,
      userId: userId,
      active: true,
      number: this.createCardNumber(),
      createdAt: serverTimestamp() as any
    };


   
    return setDoc(cardRef, newCard);
  }


  updateCard(id: string, changes: Partial<IdentityCard>): Promise<void> {
    const cardDoc = doc(this.firestore, `cards/${id}`);
    return updateDoc(cardDoc, changes);
  }

  deleteCard(id: string): Promise<void> {
    const cardDoc = doc(this.firestore, `cards/${id}`);
    return deleteDoc(cardDoc);
  }

  scanCard(cardNumber: string): Promise<string | false> {
    return runInInjectionContext(this.injector, async () => {
      const cardsColl = collection(this.firestore, 'cards');
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
      const cardsColl = collection(this.firestore, 'cards');
      const q = query(cardsColl, where('number', '==', cardNumber));
      const snap = await getDocs(q);

      if (snap.empty) {
        return false;
      }

      const card = snap.docs[0].data() as IdentityCard;
      return card.active && card.workerId === workerId;
    });
  }

  scanSupervisorCard(cardNumber: string, userId: string): Promise<boolean> {
    return runInInjectionContext(this.injector, async () => {
      const cardsColl = collection(this.firestore, 'supervisorCards');
      const q = query(cardsColl, where('number', '==', cardNumber));
      const snap = await getDocs(q);

      if (snap.empty) {
        return false;
      }

      const card = snap.docs[0].data() as SupervisorCard;
      return card.active && card.userId === userId;
    });
  }

  createCardNumber(): string {

    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 12);
    const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
    const result = timestamp + randomPart;
    console.log(`NewCard: ${result}`);
    return result;
  }
}
