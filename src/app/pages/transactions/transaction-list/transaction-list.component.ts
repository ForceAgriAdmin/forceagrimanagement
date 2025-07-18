import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MatTableModule,
  MatTableDataSource
} from '@angular/material/table';
import {
  MatPaginatorModule,
  MatPaginator
} from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  MatProgressSpinnerModule
} from '@angular/material/progress-spinner';

import { MessageModule } from '@syncfusion/ej2-angular-notifications';
import { combineLatest } from 'rxjs';

import { OperationService } from '../../../services/operation.service';
import { FarmService } from '../../../services/farm.service';
import { TransactionsService } from '../../../services/transactions.service';
import { WorkersService } from '../../../services/workerservice.service';

import { TransactionModel } from '../../../models/transactions/transaction';
import { TransactionTypeModel } from '../../../models/transactions/transactiontype';
import { WorkerModel } from '../../../models/workers/worker';
import { OperationModel } from '../../../models/operations/operation';
import { FarmModel } from '../../../models/farms/farm';
import { NotificationMessage } from '../../../models/layout/notificationmessage';

import { ForceSearchComponent } from '../../../components/general/force-search/force-search.component';
import { ForceButtonComponent } from '../../../components/general/forcebutton/forcebutton.component';
import { AddTransactionComponent } from '../../../dialogs/add-transaction/add-transaction.component';

import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  updateDoc
} from '@angular/fire/firestore';
import { HasRoleDirective } from '../../../directives/has-role.directive';
import { NotificationService } from '../../../services/notification.service';
import { EditTransactionComponent } from '../../../dialogs/edit-transaction/edit-transaction.component';

interface TransactionView {
  employeeNumber: string;
  operationName: string;
  farmName: string;
  transactionTypeName: string;
  isCredit: boolean;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  raw: TransactionModel;
}

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MessageModule,         // ← Ensure MessageModule is here
    ForceButtonComponent,
    ForceSearchComponent,
    HasRoleDirective
  ],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent implements OnInit {

  displayedColumns = [
    'employeeNumber',
    'operationName',
    'farmName',
    'transactionType',
    'amount',
    'createdAt',
    'updatedAt',
    'actions'
  ];
  dataSource = new MatTableDataSource<TransactionView>([]);
  loading = true;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ts: TransactionsService,
    private ws: WorkersService,
    private ops: OperationService,
    private fs: FarmService,
    private dialog: MatDialog,
    private afs: Firestore,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    // 1) Configure filter logic
    this.dataSource.filterPredicate = (row: TransactionView, filter: string) => {
      const haystack = [
        row.employeeNumber,
        row.operationName,
        row.farmName,
        row.transactionTypeName
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(filter);
    };

    // 2) Fetch everything in parallel, then build table rows with safe fallbacks
    combineLatest([
      this.ts.getTransactions(),
      this.ws.getWorkers(),
      this.ts.getTransactionTypes(),
      this.ops.getOperations(),
      this.fs.getFarms()
    ]).subscribe(([txs, workers, ttList, opsList, farms]) => {
      const view: TransactionView[] = [];

      txs.forEach(tx => {
        // --- Determine which worker‐IDs this tx has ---
        let workerIds: string[] = [];
        if (Array.isArray((tx as any).workerIds)) {
          workerIds = (tx as any).workerIds as string[];
        } else if (typeof (tx as any).workerId === 'string') {
          workerIds = [(tx as any).workerId];
        }

        workerIds.forEach((wid: string) => {
          const w: WorkerModel | undefined = workers.find(w => w.id === wid);
          const tt: TransactionTypeModel | undefined = ttList.find(
            t => t.id === tx.transactionTypeId
          );

          // --- Determine operation safely (new array or old single field) ---
          let op: OperationModel | undefined;
          if (Array.isArray((tx as any).operationIds)) {
            op = opsList.find(o => o.id === (tx as any).operationIds[0]);
          } else if (typeof (tx as any).operationId === 'string') {
            op = opsList.find(o => o.id === (tx as any).operationId);
          }

          const f: FarmModel | undefined = w
            ? farms.find(f => f.id === w.farmId)
            : undefined;

          if (w && tt) {
            // Decide operationName: real name or fallback to tx.function
            const opName =
              op?.name ??
              (typeof tx.function === 'string'
                ? tx.function.charAt(0).toUpperCase() + tx.function.slice(1)
                : '—');

            view.push({
              employeeNumber: w.employeeNumber,
              operationName: opName,
              farmName: f?.name ?? '—',
              transactionTypeName: tt.name,
              isCredit: tt.isCredit,
              amount: tx.amount,
              createdAt: tx.timestamp.toDate(),
              updatedAt:
                (tx as any).updatedAt?.toDate() || tx.timestamp.toDate(),
              raw: tx
            });
          }
        });
      });

      this.dataSource.data = view;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.loading = false;
    });
  }

  filterTransactions(term: string) {
    this.dataSource.filter = term.trim().toLowerCase();
  }

  clearSearch() {
    this.dataSource.filter = '';
  }

  onAddNewTransaction() {
    const ref = this.dialog.open(AddTransactionComponent, {
      width: '600px',
      maxHeight: '80vh',
      panelClass: 'transaction-dialog'
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.ts.createTransaction(result).then(() => {
          this.notify.showSuccess('Transaction added successfully');
        });
      }
    });
  }

 edit(row: TransactionView) {
  const dialogRef = this.dialog.open(EditTransactionComponent, {
    width: '800px',
    disableClose: true,
    data: { transaction: row.raw }
  });

  dialogRef.afterClosed().subscribe(async (updatedTransaction: TransactionModel | undefined) => {
    if (updatedTransaction) {
      try {

        this.notify.showSuccess('Transaction updated successfully');

        // Refresh the table
        this.ngOnInit(); // rerun logic to reload table view

      } catch (err) {
        console.error('Failed to update transaction:', err);
        this.notify.showError('Failed to update transaction. Please try again.');
      }
    }
  });
}


  delete(row: TransactionView) {
    // Confirm & call deleteTransaction if desired
  }

  
}
