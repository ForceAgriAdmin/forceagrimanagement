import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, switchMap, of, throwError } from 'rxjs';

export interface awsRekognitionResponse {
  Message: string;
  workerId: string;
}

@Injectable({
  providedIn: 'root',
})
export class FacialRekognitionService {
  private readonly apiBase =
    'https://axsvj3vxv1.execute-api.eu-west-1.amazonaws.com/Dev';
  private readonly authBucket = 'workerauthbucket';
  private readonly existingWorkerBucket = 'workerrekognitionbucket';

  constructor(private http: HttpClient) {}

  private uploadToAuthBucket(file: File | Blob, filename: string ): Observable<boolean> {
    const uploadUrl = `${this.apiBase}/${this.authBucket}/${filename}`;
    const headers = new HttpHeaders({
      'Content-Type': (file as File).type || 'application/octet-stream',
    });

    return this.http
      .put(uploadUrl, file, {
        headers,
        observe: 'response',
        responseType: 'text',
      })
      .pipe(
        switchMap((response) => {
          if (response.status === 200) {
            return of(true);
          } else {
            return throwError(
              () => new Error(`Upload failed with status ${response.status}`)
            );
          }
        })
      );
  }

  private uploadToRegisteredBucket(file: File | Blob, filename: string ): Observable<boolean> {
    const uploadUrl = `${this.apiBase}/${this.existingWorkerBucket}/${filename}`;
    const headers = new HttpHeaders({
      'Content-Type': (file as File).type || 'application/octet-stream',
    });

    return this.http
      .put(uploadUrl, file, {
        headers,
        observe: 'response',
        responseType: 'text',
      })
      .pipe(
        switchMap((response) => {
          if (response.status === 200) {
            return of(true);
          } else {
            return throwError(
              () => new Error(`Upload failed with status ${response.status}`)
            );
          }
        })
      );
  }
  private runFacialRecognition( filename: string
  ): Observable<awsRekognitionResponse> {
    const requestFacialUrl = `${this.apiBase}/worker`;
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
    const params = new HttpParams().set('objectKey', filename);

    return this.http.get<awsRekognitionResponse>(requestFacialUrl, {
      headers,
      params,
    });
  }

  PingWorkerFacialRekgnition(file: File | Blob, filename: string): Observable<awsRekognitionResponse> {
    return this.uploadToAuthBucket(file, filename).pipe(
      switchMap((success) => {
        if (success) {
          return this.runFacialRecognition(filename);
        } else {
          return throwError(() => new Error('Upload did not return success'));
        }
      })
    );
  }

  RegisterWorkerFacialRekognition(file: File | Blob, filename: string) {
    return this.uploadToRegisteredBucket(file, filename).pipe(
      switchMap((success) => {
        if (success) {
          return this.runFacialRecognition(filename);
        } else {
          return throwError(() => new Error('Upload did not return success'));
        }
      })
    );
  }
}
