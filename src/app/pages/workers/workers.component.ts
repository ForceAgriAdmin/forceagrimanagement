import { Component, } from '@angular/core';
import { MenuItem } from '../../models/layout/menuitem';
import { MenucardComponent } from '../../components/layout/menucard/menucard.component';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MessageModule } from '@syncfusion/ej2-angular-notifications'
import { WorkersService } from '../../services/workerservice.service';
import { MatDialog } from '@angular/material/dialog';
import { AddWorkerComponent } from '../../dialogs/add-worker/add-worker.component';
import { NotificationMessage } from '../../models/layout/notificationmessage';
import { NotificationService } from '../../services/notification.service';
@Component({
  selector: 'app-workers',
  imports: [ 
    CommonModule,
    MenucardComponent,
    RouterOutlet,
    RouterModule,
    MessageModule
  ],
  templateUrl: './workers.component.html',
  styleUrl: './workers.component.scss'
})
export class WorkersComponent {
  childActive: boolean = false;
  
  cards: MenuItem[] = [
    { icon: 'list', label: 'List', route: '/workers/list',eventIdentifier:'',roles: ['SuperAdmin','Admin','Manager','User']},
    { icon: 'person_add', label: 'New', route: '/' ,eventIdentifier:'addWorker',roles:['SuperAdmin','Admin','Manager','User']}
  ];

  constructor(
    private workersService: WorkersService,
      private dialog: MatDialog,
      private notify: NotificationService
  ){}
  onActivate(child: any): void {
    this.childActive = true;
  }

  onDeactivate(child: any): void {
    this.childActive = false;
  }

  handleCardClick(clickedItem: MenuItem) {
    switch (clickedItem.eventIdentifier) {
      case 'addWorker':
        this.onAddNewWorker()
        break;
      default:
        break;
    }
  }

  onAddNewWorker(): void {
      const dialogRef = this.dialog.open(AddWorkerComponent, {
        width: '1600px',
        disableClose: true
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
           this.workersService.addWorker(result).then(() => { 
             this.notify.showSuccess('Worker Added Successfully');
          });
        }
      });
    }
}
