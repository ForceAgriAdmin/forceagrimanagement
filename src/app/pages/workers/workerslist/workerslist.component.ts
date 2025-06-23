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
import { Observable, timeout } from 'rxjs';
import { AddWorkerTransactionComponent, AddWorkerTransactionDialogData } from '../../../dialogs/add-worker-transaction/add-worker-transaction.component';
import { AuthService } from '../../../services/auth.service';
import { AppUser } from '../../../models/users/user.model';
import { Timestamp } from '@angular/fire/firestore';
import { ConfirmDeleteComponent } from '../../../dialogs/confirm-delete/confirm-delete.component';
import { HasRoleDirective } from '../../../directives/has-role.directive';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TransactionsService } from '../../../services/transactions.service';

@Component({
  selector: 'app-workerslist',
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ForceButtonComponent,
    ForceSearchComponent,
    MessageModule,
    HasRoleDirective
  ],
  templateUrl: './workerslist.component.html',
  styleUrl: './workerslist.component.scss'
})
export class WorkerslistComponent implements OnInit{
  workers: WorkerModel[] = [];
  filteredWorkers: WorkerModel[] = [];
  searchTerm: string = '';
  showInactive = false; 
  operationMap: { [id: string]: string } = {};
  user$: Observable<any>;
  
   loggedInUser: AppUser = {
        uid: '',
        email: '',
        displayName: '',
        createdAt: Timestamp.now(),
        farmId: '',
        roles: []
      };
  constructor(
      private workersService: WorkersService,
      private transactionService: TransactionsService,
      private operationService: OperationService,
      private dialog: MatDialog,
      private router: Router,
      private cardService: CardService,
      private notify: NotificationService,
      private authService: AuthService) {
        this.user$ = this.authService.authState$;
      }

  ngOnInit(): void {
    this.authService.authState$.subscribe(user => {

      if (!user) {
        this.router.navigate(['/login']);
      }

      this.loggedInUser.email = user?.email || '';
      this.loggedInUser.uid = user?.uid || '';

    });
    this.workersService.getWorkers().subscribe((data: WorkerModel[]) => {
      this.workers = data;
      this.filteredWorkers = data; 
    });
    this.operationService.getOperations().subscribe((ops: OperationModel[]) => {
      ops.forEach(op => {
        this.operationMap[op.id] = op.name;
      });
    });
    this.showInactive = false;
    this.searchTerm = ''; 
  }

  filterWorkers(searchTerm: string): void {
  this.searchTerm = searchTerm || '';
  const term = this.searchTerm.toLowerCase();

  this.filteredWorkers = this.workers.filter(worker => {
    // 1) hide inactive if toggle off
    if (!this.showInactive && !worker.isActive) {
      return false;
    }

    // 2) if no search term, include (we’ve already handled inactive)
    if (!term) {
      return true;
    }

    // 3) otherwise match name or operation
    const first = worker.firstName.toLowerCase();
    const last = worker.lastName.toLowerCase();
    const op = this.getOperationName(worker.operationId).toLowerCase();
    return first.includes(term) || last.includes(term) || op.includes(term);
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
             this.notify.showSuccess('Worker added successfully');
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
              this.notify.showSuccess('Card scan successful');
              this.openAddTransactionDialog(worker);
              
          }
          else
          {

            this.cardService.scanSupervisorCard(result.cardNumber,this.loggedInUser.uid).then(supRessponse => {
              if(supRessponse){
                this.notify.showSuccess('Supervisor Card Scan Successful');
              } 
              else{
                this.notify.showError('Invalid Card!!!');
              }
            });
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
  openAddTransactionDialog(worker: WorkerModel) {
    const ref = this.dialog.open<AddWorkerTransactionComponent, AddWorkerTransactionDialogData, any>(
      AddWorkerTransactionComponent,
      {
        width: '600px',
        data: { worker }
      }
    );

    ref.afterClosed().subscribe(result => {
      if (result) {
        // result will be { transactionTypeId, amount, description, worker }
        console.log('New transaction payload:', result);
        // → call your service to save the transaction...
      }
    });
  }
  onRemove(worker: WorkerModel) {
    
        const dlg = this.dialog.open(ConfirmDeleteComponent, {
          width: '350px',
          data: { name: `${worker.firstName} ${worker.lastName}` }
        });
        dlg.afterClosed().subscribe(yes => {

          if (!yes) return;

          this.workersService.deleteWorker(worker.id).then(() => {
            this.notify.showSuccess('Worker deleted successfully');

          }).catch(()=>{
            this.notify.showError('Unable to delete worker');
          });

        });
  }

  getOperationName(operationId: string): string {
    return this.operationMap[operationId] || 'Unknown';
  }
}
