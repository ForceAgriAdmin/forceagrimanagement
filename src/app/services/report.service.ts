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
  docData,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { AppReport } from '../models/reports/appreport';
import { AppGenericReport } from '../models/reports/appgenericreport';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private colPath = 'reports';
  private colPathGeneric = 'genericReports';

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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
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
        updatedAt: Timestamp.now()
      })
    );
  }

  deleteReport(id: string): Observable<void> {
    const ref = doc(this.firestore, `${this.colPath}/${id}`);
    return from(deleteDoc(ref));
  }

  //Generic

  getGenericReports(): Observable<(AppGenericReport & { id: string })[]> {
    const colRef = collection(this.firestore, this.colPathGeneric);
    return collectionData(colRef, { idField: 'id' }) as Observable<
      (AppGenericReport & { id: string })[]
    >;
  }

  getGenericReportById(id: string): Observable<AppGenericReport & { id: string }> {
    const ref = doc(this.firestore, `${this.colPathGeneric}/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<
      AppGenericReport & { id: string }
    >;
  }

  createGenericReport(r: Omit<AppGenericReport, 'id' | 'createdAt' | 'updatedAt'| 'isWorkerReport' | 'isOperationReport' | 'isTransactionTypeReport'>): Observable<void> {
    const colRef = collection(this.firestore, this.colPathGeneric);
    const newRef = doc(colRef);
    return from(
      setDoc(newRef, {
        ...r,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    );
  }

  updateGenericReport(
    id: string,
    r: Partial<Omit<AppGenericReport, 'id' | 'createdAt' | 'updatedAt'>>
  ): Observable<void> {
    const ref = doc(this.firestore, `${this.colPathGeneric}/${id}`);
    return from(
      updateDoc(ref, {
        ...r,
        updatedAt: Timestamp.now()
      })
    );
  }

  deleteGenericReport(id: string): Observable<void> {
    const ref = doc(this.firestore, `${this.colPathGeneric}/${id}`);
    return from(deleteDoc(ref));
  }
}
