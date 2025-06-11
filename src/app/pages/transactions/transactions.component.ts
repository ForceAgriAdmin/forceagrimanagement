import { Component } from '@angular/core';
import { MenuItem } from '../../models/layout/menuitem';
import { CommonModule } from '@angular/common';
import { MenucardComponent } from '../../components/layout/menucard/menucard.component';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MessageModule } from '@syncfusion/ej2-angular-notifications';
import { WorkerModel } from '../../models/workers/worker';
import {
  CardScanComponent,
  CardScanDialogData,
} from '../../dialogs/card-scan/card-scan.component';
import { MatDialog } from '@angular/material/dialog';
import { CardService } from '../../services/card.service';
import { NotificationMessage } from '../../models/layout/notificationmessage';
import {
  AddWorkerTransactionComponent,
  AddWorkerTransactionDialogData,
} from '../../dialogs/add-worker-transaction/add-worker-transaction.component';
import { WorkersService } from '../../services/workerservice.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-transactions',
  imports: [
    CommonModule,
    MenucardComponent,
    RouterOutlet,
    RouterModule,
    MessageModule,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent {
  childActive: boolean = false;
  worker!: WorkerModel;
  cards: MenuItem[] = [
    {
      icon: 'list',
      label: 'List',
      route: '/transactions/list',
      eventIdentifier: '',
      roles: ['SuperAdmin','Admin','Manager','User']
    },
    {
      icon: 'payments',
      label: 'New',
      route: '/',
      eventIdentifier: 'addTransaction',
      roles: ['SuperAdmin','Admin','Manager','User'] 
    },
    //{ icon: 'summarize', label: 'Reports', route: '/transactions/reports' }
  ];

  constructor(
    private dialog: MatDialog,
    private cardService: CardService,
    private workersService: WorkersService,
    private notify: NotificationService
  ) {}
  onActivate(child: any): void {
    this.childActive = true;
  }

  onDeactivate(child: any): void {
    this.childActive = false;
  }

  handleCardClick(clickedItem: MenuItem) {
    switch (clickedItem.eventIdentifier) {
      case 'addTransaction':
        this.onAddTransaction();
        break;
      default:
        break;
    }
  }

  onAddTransaction() {
    const dialogRef = this.dialog.open<
      CardScanComponent,
      CardScanDialogData,
      { cardNumber: string }
    >(CardScanComponent, {
      width: '400px',
      data: { workerId: '' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.cardNumber) {
        this.cardService.scanCard(result.cardNumber).then((response) => {
          if (response) {
            this.workersService.getWorker(response).subscribe({
              next: (w) => {
                this.worker = w;
                this.notify.showSuccess('Card Scan Successful');
                this.openAddTransactionDialog(this.worker);
              },
              error: (err) => {
                console.error('Error loading worker:', err);
              },
            });
          }
          else {
            this.notify.showError('Invalid Card');
          }
        });
      }
    });
  }

  openAddTransactionDialog(worker: WorkerModel) {
    const ref = this.dialog.open<
      AddWorkerTransactionComponent,
      AddWorkerTransactionDialogData,
      any
    >(AddWorkerTransactionComponent, {
      width: '600px',
      data: { worker },
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        // result will be { transactionTypeId, amount, description, worker }
        console.log('New transaction payload:', result);
        // → call your service to save the transaction...
      }
    });
  }
}
