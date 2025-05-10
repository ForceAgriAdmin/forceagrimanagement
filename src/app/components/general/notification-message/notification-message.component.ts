import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageModule } from '@syncfusion/ej2-angular-notifications';
import { AsyncPipe, NgForOf } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, NgForOf, AsyncPipe, MessageModule],
  template: `
    <ng-container *ngIf="notificationService.messages$ | async as messages">
      <ng-container *ngFor="let not of messages">
        <ejs-message [id]="not.id" [severity]="not.severity">
          {{ not.message }}
        </ejs-message>
        <br /><br />
      </ng-container>
    </ng-container>
  `
})
export class NotificationListComponent {
  constructor(public notificationService: NotificationService) {}
}
