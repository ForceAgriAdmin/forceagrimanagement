import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NotificationMessage } from '../models/layout/notificationmessage';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  // Internal subject holding the current list of messages
  private _messages = new BehaviorSubject<NotificationMessage[]>([]);
  // Public observable for your component to bind to
  public messages$: Observable<NotificationMessage[]> = this._messages.asObservable();

  showInfo(message: string) {
    this.enqueue({ severity: 'Info', message });
  }

  showSuccess(message: string) {
    this.enqueue({ severity: 'Success', message });
  }

  showWarning(message: string) {
    this.enqueue({ severity: 'Warning', message });
  }

  showError(message: string) {
    this.enqueue({ severity: 'Error', message });
  }

  private enqueue(partial: Omit<NotificationMessage, 'id'>) {
    const id = Date.now().toString();
    const msg: NotificationMessage = { id, ...partial };
    // append to the list
    this._messages.next([...this._messages.value, msg]);
    // schedule removal after 3 seconds
    setTimeout(() => this.dismiss(id), 3000);
  }

  /** Remove a message by ID */
  dismiss(id: string) {
    this._messages.next(
      this._messages.value.filter(m => m.id !== id)
    );
  }
}
