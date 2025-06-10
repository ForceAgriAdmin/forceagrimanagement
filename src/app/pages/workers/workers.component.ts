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
notifications: NotificationMessage[] = [];
  message!: NotificationMessage;
  cards: MenuItem[] = [
    { icon: 'list', label: 'List', route: '/workers/list',eventIdentifier:'',roles: [] },
    { icon: 'person_add', label: 'New', route: '/' ,eventIdentifier:'addWorker',roles:[]}
  ];

  constructor(
    private workersService: WorkersService,
      private dialog: MatDialog
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
             this.message = {
                  id: 'msg_success',
                  severity: 'Success',
                  message: 'Worker Added Successful',
                };
                this.notifications.push(this.message);
          });
        }
      });
    }
}
