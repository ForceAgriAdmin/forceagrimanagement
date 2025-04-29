import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WorkersService } from '../../../services/workerservice.service'; 
import { WorkerModel } from '../../../models/workers/worker';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { OperationModel } from '../../../models/operations/operation';
import { OperationService } from '../../../services/operation.service';
import {ForceButtonComponent} from '../../../components/general/forcebutton/forcebutton.component'
import {ForceSearchComponent} from '../../../components/general/force-search/force-search.component'

import { AddWorkerComponent } from '../../../dialogs/add-worker/add-worker.component'; // adjust the path accordingly
import { MatDialog } from '@angular/material/dialog';
import { CardScanComponent, CardScanDialogData } from '../../../dialogs/card-scan/card-scan.component';
import { CardService } from '../../../services/card.service';
import { NotificationService } from '../../../services/notification.service';
import { MessageModule } from '@syncfusion/ej2-angular-notifications'
import { NotificationMessage } from '../../../models/layout/notificationmessage';
import { timeout } from 'rxjs';

@Component({
  selector: 'app-workerslist',
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ForceButtonComponent,
    ForceSearchComponent,
    MessageModule
  ],
  templateUrl: './workerslist.component.html',
  styleUrl: './workerslist.component.scss'
})
export class WorkerslistComponent implements OnInit{
  workers: WorkerModel[] = [];
  notifications: NotificationMessage[] = [];
  message!: NotificationMessage;
  filteredWorkers: WorkerModel[] = [];
  searchTerm: string = '';
  operationMap: { [id: string]: string } = {};
  constructor(
      private workersService: WorkersService,
      private operationService: OperationService,
      private dialog: MatDialog,
      private router: Router,
      private cardService: CardService,
      private notficationService: NotificationService) {}

  ngOnInit(): void {
    this.workersService.getWorkers().subscribe((data: WorkerModel[]) => {
      this.workers = data;
      this.filteredWorkers = data; 
    });
    this.operationService.getOperations().subscribe((ops: OperationModel[]) => {
      ops.forEach(op => {
        this.operationMap[op.id] = op.name;
      });
    });

  }

  filterWorkers(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredWorkers = this.workers;
      return;
    }
    const term = searchTerm.toLowerCase();
    this.filteredWorkers = this.workers.filter((worker) => {
      const firstName = worker.firstName.toLowerCase();
      const lastName = worker.lastName.toLowerCase();
      const operation = this.getOperationName(worker.operationId).toLowerCase();
      return (
        firstName.includes(term) ||
        lastName.includes(term) ||
        operation.includes(term)
      );
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredWorkers = this.workers;
  }

  onAddNewWorker(): void {
    const dialogRef = this.dialog.open(AddWorkerComponent, {
      width: '1600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
         this.workersService.addWorker(result).then(() => { 
            
          });
      }
    });
  }

  onAddTransaction(worker: WorkerModel) {
    const dialogRef = this.dialog.open<CardScanComponent, CardScanDialogData, { cardNumber: string }>(
      CardScanComponent,
      {
        width: '400px',
        data: { workerId: worker.id ?? null },
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result?.cardNumber) {
        this.cardService.scanWorkerCard(result.cardNumber,worker.id).then(response => {
          if(response){
              this.message = {id: 'msg_info',severity:'Info',message:'Card Scan Successful'};
              this.notifications.push(this.message);
              setTimeout(() => {
                console.log('Waited 3 seconds');
                this.notifications.pop();
              }, 3000);
              
          }
          else{
            this.message = {id: 'msg_error',severity:'Error',message:'Invalid Card!!!'};
              this.notifications.push(this.message);
          }
        });
      }
    });
  }
  
  onEdit(worker: WorkerModel) {
    this.router.navigate(
      ['/workers', 'list', 'edit', worker.id]
    );
  }
  
  onRemove(worker: WorkerModel) {
    console.log('Remove worker', worker.firstName);
    // ...
  }

  getOperationName(operationId: string): string {
    return this.operationMap[operationId] || 'Unknown';
  }
}
