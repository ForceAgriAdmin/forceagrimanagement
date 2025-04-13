import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'forceagri-46988',
        appId: '1:526162217915:web:515eac63d241fab8f8529e',
        storageBucket: 'forceagri-46988.firebasestorage.app',
        apiKey: 'AIzaSyADIY57ZmasTmV8rLMNCsRWRellwhkug70',
        authDomain: 'forceagri-46988.firebaseapp.com',
        messagingSenderId: '526162217915',
        measurementId: 'G-3JF7XPNCN3',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};
