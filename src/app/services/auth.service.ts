import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut, UserProfile,User as FirebaseUser,
  UserCredential,
  createUserWithEmailAndPassword,
  updateProfile} from '@angular/fire/auth';
import { setDoc, doc, serverTimestamp, Firestore } from '@angular/fire/firestore';
import { from, map, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth: Auth, private injector: Injector,private firestore: Firestore) {}

  get authState$() {
    return new Observable<FirebaseUser | null>(subscriber =>
      runInInjectionContext(this.injector, () =>
        onAuthStateChanged(this.auth, subscriber)
      )
    );
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }

  createUser(
    email: string,
    password: string,
    displayName: string
  ): Observable<FirebaseUser> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      switchMap((cred: UserCredential) =>
        from(
          updateProfile(cred.user, { displayName })
        ).pipe(map(() => cred.user))
      ),
      switchMap(user =>
        from(
          setDoc(doc(this.firestore, `users/${user.uid}`), {
            uid: user.uid,
            email: user.email,
            displayName,
            createdAt: serverTimestamp()
          })
        ).pipe(map(() => user))
      )
    );
  }
}
