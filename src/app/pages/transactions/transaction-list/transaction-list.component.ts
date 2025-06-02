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
    MatProgressSpinnerModule,
    MessageModule,         // ← Ensure MessageModule is here
    ForceButtonComponent,
    ForceSearchComponent
  ],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
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
    private dialog: MatDialog,
    private afs: Firestore
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
              _raw: tx
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
    // Open edit dialog if needed
  }

  delete(row: TransactionView) {
    // Confirm & call deleteTransaction if desired
  }

  /**
   * Migrate old‐schema transactions → new array‐based schema
   */
  async MigrateAllTransactions(): Promise<void> {
    try {
      const txCol = collection(this.afs, 'transactions');
      const snapshot = await getDocs(txCol);

      for (const txSnap of snapshot.docs) {
        const txId = txSnap.id;
        if (txId === 'ptWdSKsbQqSBs7Bgo63g') {
          console.log(`Skipping already‐migrated TX ${txId}`);
          continue;
        }

        const existingData = txSnap.data() as any;
        if (
          Array.isArray(existingData.workerIds) &&
          Array.isArray(existingData.operationIds) &&
          Array.isArray(existingData.workerTypesIds) &&
          Array.isArray(existingData.paymentGroupIds)
        ) {
          console.log(`TX ${txId} already uses new schema; skipping.`);
          continue;
        }

        // 2) Read old‐schema fields
        const oldWorkerId = existingData.workerId as string | undefined;
        const oldMulti = Array.isArray(existingData.multiWorkerIds)
          ? (existingData.multiWorkerIds as string[])
          : [];
        const oldOperation = existingData.operationId as string | undefined;

        // 3) Build new workerIds array (dedupe)
        const workerIdSet = new Set<string>();
        if (typeof oldWorkerId === 'string' && oldWorkerId.trim()) {
          workerIdSet.add(oldWorkerId);
        }
        for (const w of oldMulti) {
          if (typeof w === 'string' && w.trim()) {
            workerIdSet.add(w);
          }
        }
        const allWorkerIds = Array.from(workerIdSet);
        console.log(`TX ${txId}: computed workerIds =`, allWorkerIds);

        // 4) Build operationIds array
        const operationIds: string[] = [];
        if (typeof oldOperation === 'string' && oldOperation.trim()) {
          operationIds.push(oldOperation);
        }
        console.log(`TX ${txId}: computed operationIds =`, operationIds);

        // 5) Fetch each worker to gather workerTypeId + paymentGroupIds
        const workerTypeSet = new Set<string>();
        const paymentGroupSet = new Set<string>();

        for (const wid of allWorkerIds) {
          try {
            const wRef = doc(this.afs, 'workers', wid);
            const wSnap = await getDoc(wRef);
            if (!wSnap.exists()) {
              console.warn(
                `  • [${txId}] Worker ${wid} not found; skipping.`
              );
              continue;
            }
            const wData = wSnap.data() as any;
            if (typeof wData.workerTypeId === 'string') {
              workerTypeSet.add(wData.workerTypeId);
            }
            if (Array.isArray(wData.paymentGroupIds)) {
              wData.paymentGroupIds.forEach((pg: string) =>
                paymentGroupSet.add(pg)
              );
            }
          } catch (err) {
            console.error(
              `  • [${txId}] Error fetching worker ${wid}:`,
              err
            );
          }
        }

        const workerTypesIds = Array.from(workerTypeSet);
        const paymentGroupIds = Array.from(paymentGroupSet);
        console.log(
          `TX ${txId}: computed workerTypesIds =`,
          workerTypesIds
        );
        console.log(
          `TX ${txId}: computed paymentGroupIds =`,
          paymentGroupIds
        );

        // 6) Build payload and update Firestore
        const updatePayload: Partial<any> = {
          workerIds: allWorkerIds,
          operationIds: operationIds,
          workerTypesIds: workerTypesIds,
          paymentGroupIds: paymentGroupIds
        };

        const txRef = doc(this.afs, 'transactions', txId);
        await updateDoc(txRef, updatePayload);
        console.log(`✔ TX ${txId} migrated with:`, updatePayload);
        this.notifications.push({
          id: `migrate_${txId}`,
          severity: 'Success',
          message: `Transaction ${txId} migrated.`
        });
      }

      console.log('✅ All migrations complete.');
    } catch (err) {
      console.error('Migration failed:', err);
      this.notifications.push({
        id: 'migrate_all_error',
        severity: 'Error',
        message: `Migration failed: ${(err as any).message || err}`
      });
    }
  }
}
