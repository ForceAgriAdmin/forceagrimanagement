import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth: Auth, private injector: Injector) {}

  get user$(): Observable<any> {
    return new Observable(subscriber => {
      return runInInjectionContext(this.injector, () => {
        return onAuthStateChanged(this.auth, subscriber);
      });
    });
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }
}
