import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  docData
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { AppReport } from '../models/reports/appreport';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private colPath = 'reports';

  constructor(private firestore: Firestore) {}

  getReports(): Observable<(AppReport & { id: string })[]> {
    const colRef = collection(this.firestore, this.colPath);
    return collectionData(colRef, { idField: 'id' }) as Observable<
      (AppReport & { id: string })[]
    >;
  }

  getReportById(id: string): Observable<AppReport & { id: string }> {
    const ref = doc(this.firestore, `${this.colPath}/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<
      AppReport & { id: string }
    >;
  }

  createReport(r: Omit<AppReport, 'id' | 'createdAt' | 'updatedAt'>): Observable<void> {
    const colRef = collection(this.firestore, this.colPath);
    const newRef = doc(colRef);
    return from(
      setDoc(newRef, {
        ...r,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );
  }

  updateReport(
    id: string,
    r: Partial<Omit<AppReport, 'id' | 'createdAt' | 'updatedAt'>>
  ): Observable<void> {
    const ref = doc(this.firestore, `${this.colPath}/${id}`);
    return from(
      updateDoc(ref, {
        ...r,
        updatedAt: serverTimestamp()
      })
    );
  }

  deleteReport(id: string): Observable<void> {
    const ref = doc(this.firestore, `${this.colPath}/${id}`);
    return from(deleteDoc(ref));
  }
}
