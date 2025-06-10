// src/app/services/auth.service.ts
import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
  sendPasswordResetEmail
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  docData,
  collectionData,
  serverTimestamp
} from '@angular/fire/firestore';
import {
  Observable,
  catchError,
  defer,
  from,
  map,
  of,
  switchMap
} from 'rxjs';
import { AppUser } from '../models/users/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private auth: Auth,
    private injector: Injector,
    private firestore: Firestore
  ) {}

  public authState$ = new Observable<FirebaseUser | null>(subscriber =>
    runInInjectionContext(this.injector, () =>
      onAuthStateChanged(this.auth, subscriber)
    )
  );

  public currentUserDoc$ = this.authState$.pipe(
    switchMap(user => {
      if (!user) {
        return of<AppUser | null>(null);
      }
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      return defer(() =>
        runInInjectionContext(this.injector, () =>
          docData(userDocRef, { idField: 'uid' }) as Observable<AppUser>
        )
      );
    })
  );

 public currentUserRoles$ = this.currentUserDoc$.pipe(
    map(record => {
      const raw = record?.roles;
      if (!Array.isArray(raw) || raw.length === 0) {
        return ['User'];
      }
      const filtered = raw.filter(
        r => typeof r === 'string' && r.trim().length > 0
      );
      return filtered.length > 0 ? filtered : ['User'];
    })
  );

  login(email: string, password: string): Observable<boolean> {
  return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
    map(() => true), // Sign-in successful
    catchError((error) => {
      console.error('Login failed', error);
      return of(false); // Sign-in failed
    })
  );
}

 resetPassword(email: string): Observable<boolean> {
  return from(sendPasswordResetEmail(this.auth, email)).pipe(
    map(() => true), // Sign-in successful
    catchError((error) => {
      console.error('Send Reset email failed', error);
      return of(false); // Sign-in failed
    })
  );
}



  logout(): Promise<void> {
    return signOut(this.auth);
  }

  /**
   * Create a new user in Auth (with tempPassword),
   * then write a Firestore doc (including that tempPassword)
   * so your onCreate trigger can email them.
   */
  createUser(
    email: string,
    tempPassword: string,
    displayName: string,
    roles: string[]
  ): Observable<FirebaseUser> {
    return new Observable<FirebaseUser>(observer => {
      createUserWithEmailAndPassword(this.auth, email, tempPassword)
        .then(cred =>
          updateProfile(cred.user, { displayName }).then(() => cred.user)
        )
        .then(user =>
          setDoc(
            doc(this.firestore, `users/${user.uid}`),
            {
              uid: user.uid,
              email: user.email,
              displayName,
              roles,
              tempPassword,
              createdAt: serverTimestamp()
            }
          ).then(() => user)
        )
        .then(user => {
          observer.next(user);
          observer.complete();
        })
        .catch(err => {
          console.error('createUser error:', err);
          observer.error(err);
        });
    });
  }

  getUsers(): Observable<AppUser[]> {
    const usersCol = collection(this.firestore, 'users');
    return defer(() =>
      runInInjectionContext(this.injector, () =>
        collectionData(usersCol, { idField: 'uid' }) as Observable<AppUser[]>
      )
    );
  }

  editUser(
    uid: string,
    data: Partial<{
      email: string;
      displayName: string;
      roles: string[];
    }>
  ): Observable<void> {
    return from(
      updateDoc(
        doc(this.firestore, `users/${uid}`),
        {
          ...data,
          updatedAt: serverTimestamp()
        }
      )
    );
  }
  deleteUser(uid: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, `users/${uid}`)));
  }
}
