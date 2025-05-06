import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { OperationService } from '../../../services/operation.service';
import { FarmService } from '../../../services/farm.service';
import { TransactionsService } from '../../../services/transactions.service';
import { TransactionModel } from '../../../models/transactions/transaction';
import { WorkersService } from '../../../services/workerservice.service';
import { NotificationMessage } from '../../../models/layout/notificationmessage';
import { MessageModule } from '@syncfusion/ej2-angular-notifications';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { combineLatest } from 'rxjs';
import { ForceSearchComponent } from '../../../components/general/force-search/force-search.component';
import { ForceButtonComponent } from '../../../components/general/forcebutton/forcebutton.component';
import { AddTransactionComponent } from '../../../dialogs/add-transaction/add-transaction.component';

interface TransactionView {
  employeeNumber: string;
  operationName: string;
  farmName: string;
  transactionTypeName: string;
  isCredit: boolean;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  _raw: TransactionModel;
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
    MessageModule,
    MatProgressSpinnerModule,
    ForceButtonComponent,
    ForceSearchComponent
  ],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnInit {
  notifications: NotificationMessage[] = [];
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
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataSource.filterPredicate = (row: TransactionView, filter: string) => {
      const haystack = [
        row.employeeNumber,
        row.operationName,
        row.farmName,
        row.transactionTypeName
      ].join(' ').toLowerCase();
      return haystack.includes(filter);
    };

    combineLatest([
      this.ts.getTransactions(),
      this.ws.getWorkers(),
      this.ts.getTransactionTypes(),
      this.ops.getOperations(),
      this.fs.getFarms()
    ]).subscribe(([txs, workers, ttList, opsList, farms]) => {
      const view = txs.map(tx => {
        const w = workers.find(w => w.id === tx.workerId)!;
        const tt = ttList.find(t => t.id === tx.transactionTypeId)!;
        const op = opsList.find(o => o.id === tx.operationId)!;
        const f = farms.find(f => f.id === w.farmId)!;

        return {
          employeeNumber: w.employeeNumber,
          operationName: op.name,
          farmName: f.name,
          transactionTypeName: tt.name,
          isCredit: tt.isCredit,
          amount: tx.amount,
          createdAt: tx.timestamp.toDate(),
          updatedAt: (tx as any).updatedAt?.toDate() || tx.timestamp.toDate(),
          _raw: tx
        } as TransactionView;
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
    maxHeight: '80vh',           // constrain vertical size
    panelClass: 'transaction-dialog'
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.ts.createTransaction(result).then(() => {
          // optionally show a notification or refresh
          this.notifications.push({
            id: 'msg_success',
            severity: 'Success',
            message: 'Transaction added successfully'
          });
        });
      }
    });
  }

  edit(row: TransactionView) {
    // open edit dialog if needed
  }

  delete(row: TransactionView) {
    // confirm & call deleteTransaction
  }
}
