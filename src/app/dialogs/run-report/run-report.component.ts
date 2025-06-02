// src/app/components/run-report/run-report.component.ts

import {
  Component,
  Inject,
  Injector,
  OnInit,
  runInInjectionContext
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatFormFieldModule }    from '@angular/material/form-field';
import { MatSelectModule }       from '@angular/material/select';
import { MatDatepickerModule }   from '@angular/material/datepicker';
import { MatInputModule }        from '@angular/material/input';
import { MatButtonModule }       from '@angular/material/button';
import { MatNativeDateModule }   from '@angular/material/core';

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Firestore,
  documentId
} from '@angular/fire/firestore';
import * as XLSX from 'xlsx';

import { AppReport }              from '../../models/reports/appreport';
import { Association }           from '../../models/reports/association';
import { PrintingService }        from '../../services/printing.service';

import { TransactionsService }    from '../../services/transactions.service';
import { WorkersService }         from '../../services/workerservice.service';
import { OperationService }       from '../../services/operation.service';
import { FarmService }            from '../../services/farm.service';
import { PaymentGroupService }    from '../../services/payment-group.service';
import { WorkerModel } from '../../models/workers/worker';

// Property map so we know which keys come from Worker docs
const PROPERTY_MAP: Record<Association, { key: string; label: string }[]> = {
  Workers: [
    { key: 'firstName',      label: 'First Name' },
    { key: 'lastName',       label: 'Last Name' },
    { key: 'idNumber',       label: 'ID Number' },
    { key: 'employeeNumber', label: 'Employee Number' }
  ],
  Operations: [
    { key: 'name',        label: 'Operation Name' },
    { key: 'description', label: 'Operation Description' }
  ],
  WorkerType: [
    { key: 'description', label: 'Worker Type Description' }
  ],
  TransactionType: [
    { key: 'name',        label: 'Transaction Type' },
    { key: 'description', label: 'Type Description' },
    { key: 'isCredit',    label: 'Is Credit?' }
  ],
  PaymentGroup: [
    { key: 'description', label: 'Group Description' }
  ]
};

@Component({
  selector: 'app-run-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatNativeDateModule
  ],
  templateUrl: './run-report.component.html',
  styleUrls: ['./run-report.component.scss']
})
export class RunReportComponent implements OnInit {
  form!: FormGroup;

  // Only used to populate the dropdowns, not for join logic
  lookup: Record<Association, any[]> = {
    Workers: [],
    Operations: [],
    WorkerType: [],
    TransactionType: [],
    PaymentGroup: []
  };

  end: 'center'|'start'|'end'|undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RunReportComponent>,
    @Inject(MAT_DIALOG_DATA) public report: AppReport,
    private afs: Firestore,
    private printSvc: PrintingService,
    private injector: Injector,
    private ts: TransactionsService,
    private ws: WorkersService,
    private ops: OperationService,
    private fs: FarmService,
    private pgs: PaymentGroupService
  ) {}

  ngOnInit() {
    const today = new Date();
    const start = this.report.createdAt.toDate();

    // Build form: date pickers + one FormControl per association
    this.form = this.fb.group({
      from: [start],
      to:   [today]
    });
    this.report.associations.forEach(a => {
      this.form.addControl(a, this.fb.control([]));
    });

    // Preload dropdowns only if the report includes that association
    if (this.report.associations.includes('Workers')) {
      this.ws.getWorkers().subscribe(r => (this.lookup.Workers = r));
    }
    if (this.report.associations.includes('Operations')) {
      this.ops.getOperations().subscribe(r => (this.lookup.Operations = r));
    }
    if (this.report.associations.includes('WorkerType')) {
      this.ws.getWorkerTypes().subscribe(r => (this.lookup.WorkerType = r));
    }
    if (this.report.associations.includes('TransactionType')) {
      this.ts.getTransactionTypes().subscribe(r => (this.lookup.TransactionType = r));
    }
    if (this.report.associations.includes('PaymentGroup')) {
      this.pgs.getGroups().subscribe(r => (this.lookup.PaymentGroup = r));
    }
  }

  /**
   * 1) Fetch all transactions in the given date range (no other Firestore filters).
   * 2) In‐memory filter any “Workers” selection (old‐ or new‐schema fields).
   * 3) Collect every unique workerId still in the filtered list.
   * 4) Batch‐fetch all those Worker docs into workerCache.
   * 5) Build each final row, setting row[key] = tx[key] or workerData[key] as needed.
   */
  private async fetchFilteredRows(): Promise<any[]> {
  // 1) Read date range from the form
  const fromDate: Date = this.form.value.from;
  const toDate:   Date = this.form.value.to;
  console.debug('fetchFilteredRows():', { fromDate, toDate, form: this.form.value });

  // 2) Query Firestore for all transactions in that date range (no other filters here)
  const txCol = collection(this.afs, 'transactions');
  const dateQ = query(
    txCol,
    where('timestamp', '>=', fromDate),
    where('timestamp', '<=', toDate)
  );
  const txSnapshot = await runInInjectionContext(this.injector, () => getDocs(dateQ));
  console.debug(`  → fetched ${txSnapshot.size} transactions (date only).`);

  // 3) Map to a simple array of { id, data: tx }
  const rawTxs = txSnapshot.docs.map(docSnap => ({
    id: docSnap.id,
    data: docSnap.data() as any
  }));

  // 4) Gather every unique worker ID from rawTxs (old or new schema):
  //    – new schema: tx.workerIds[]
  //    – old schema: tx.workerId  or tx.multiWorkerIds[]
  const workerIdSet = new Set<string>();
  rawTxs.forEach(({ data: tx }) => {
    if (Array.isArray(tx.workerIds) && tx.workerIds.length) {
      tx.workerIds.forEach((wid: string) => workerIdSet.add(wid));
    } else if (typeof tx.workerId === 'string' && tx.workerId) {
      workerIdSet.add(tx.workerId);
    } else if (Array.isArray(tx.multiWorkerIds) && tx.multiWorkerIds.length) {
      tx.multiWorkerIds.forEach((wid: string) => workerIdSet.add(wid));
    }
  });
  console.debug('  → unique worker IDs to fetch:', Array.from(workerIdSet));

  // 5) Batch‐fetch all Worker docs in chunks of 10 IDs at a time
  //    Use a Map<workerId, WorkerModel|null> as our cache
  const workerCache = new Map<string, WorkerModel|null>();
  const allWorkerIds = Array.from(workerIdSet);
  // Break into chunks of 10
  for (let i = 0; i < allWorkerIds.length; i += 10) {
    const chunk = allWorkerIds.slice(i, i + 10);
    // Firestore query: where(documentId(), 'in', chunk)
    const wq = query(
      collection(this.afs, 'workers'),
      where(documentId(), 'in', chunk)
    );
    const wSnapshot = await runInInjectionContext(this.injector, () => getDocs(wq));
    // Populate cache with the returned docs
    wSnapshot.docs.forEach(docSnap => {
      workerCache.set(docSnap.id, docSnap.data() as WorkerModel);
    });
    // For any ID in this chunk not returned, set null
    chunk.forEach((wid) => {
      if (!workerCache.has(wid)) {
        workerCache.set(wid, null);
      }
    });
  }
  console.debug('  → workerCache populated (batches of 10):', workerCache);

  // 6) Now: In‐memory filter of rawTxs by each selected association
  //    The five possible associations are: Workers, Operations, WorkerType,
  //    TransactionType, PaymentGroup
  const filteredTxs = rawTxs.filter(({ id: txId, data: tx }) => {
    // Build the “effective” arrays/IDs for this transaction (old or new schema):
    let effectiveWorkerIds: string[] = [];
    if (Array.isArray(tx.workerIds) && tx.workerIds.length) {
      effectiveWorkerIds = tx.workerIds;
    } else if (typeof tx.workerId === 'string' && tx.workerId) {
      effectiveWorkerIds = [tx.workerId];
    } else if (Array.isArray(tx.multiWorkerIds) && tx.multiWorkerIds.length) {
      effectiveWorkerIds = tx.multiWorkerIds;
    }

    let effectiveOpIds: string[] = [];
    if (Array.isArray(tx.operationIds) && tx.operationIds.length) {
      effectiveOpIds = tx.operationIds;
    } else if (typeof tx.operationId === 'string' && tx.operationId) {
      effectiveOpIds = [tx.operationId];
    }

    const effectiveTTypeId: string | null = tx.transactionTypeId || null;
    const effectivePGIds: string[] = Array.isArray(tx.paymentGroupIds)
      ? tx.paymentGroupIds
      : [];

    // For each chosen association in the report, check if this tx passes:
    for (const a of this.report.associations) {
      const selected: string[] = this.form.value[a] || [];
      if (!Array.isArray(selected) || selected.length === 0) {
        // If user didn’t pick any IDs for this association, skip it
        continue;
      }

      switch (a) {
        case 'Workers': {
          // tx must have at least one worker ID in common with selected[]
          if (!selected.some((wid: string) => effectiveWorkerIds.includes(wid))) {
            return false;
          }
          break;
        }
        case 'Operations': {
          // tx must have at least one operation ID in common with selected[]
          if (!selected.some((oid: string) => effectiveOpIds.includes(oid))) {
            return false;
          }
          break;
        }
        case 'WorkerType': {
          // At least one of this tx’s worker IDs must map (via workerCache)
          // to a workerTypeId that is in selected[]
          const matchesWorkerType = effectiveWorkerIds.some((wid: string) => {
            const wd = workerCache.get(wid);
            return wd?.workerTypeId && selected.includes(wd.workerTypeId);
          });
          if (!matchesWorkerType) {
            return false;
          }
          break;
        }
        case 'TransactionType': {
          // tx.transactionTypeId must be in selected[]
          if (!effectiveTTypeId || !selected.includes(effectiveTTypeId)) {
            return false;
          }
          break;
        }
        case 'PaymentGroup': {
          // tx.paymentGroupIds must share at least one ID with selected[]
          if (!effectivePGIds.some((pgid: string) => selected.includes(pgid))) {
            return false;
          }
          break;
        }
        // If future associations arise, handle them here
      }
    }

    // If we never returned false, this transaction passes all chosen‐association filters
    return true;
  });
  console.debug(`  → after dynamic in‐memory filter: ${filteredTxs.length} transactions remain.`);

  // 7) Finally: Build all output rows. For each transaction, output one row per worker.
  //    If a transaction has no worker IDs, we still output exactly one row so that
  //    transaction fields (amount, function, etc.) show up.
  const allRows: any[] = [];
  filteredTxs.forEach(({ id: txId, data: tx }) => {
    // Recompute effectiveWorkerIds
    let effectiveWorkerIds: string[] = [];
    if (Array.isArray(tx.workerIds) && tx.workerIds.length) {
      effectiveWorkerIds = tx.workerIds;
    } else if (typeof tx.workerId === 'string' && tx.workerId) {
      effectiveWorkerIds = [tx.workerId];
    } else if (Array.isArray(tx.multiWorkerIds) && tx.multiWorkerIds.length) {
      effectiveWorkerIds = tx.multiWorkerIds;
    }

    // If no worker IDs, produce exactly one “blank‐worker” row
    const loopIds = effectiveWorkerIds.length ? effectiveWorkerIds : [null as any];

    loopIds.forEach((wid) => {
      const row: any = {};
      this.report.fields.forEach((f) => {
        const key = f.key;

        // (a) If the transaction itself contains this key, use it:
        if (key in tx) {
          row[key] = (tx as any)[key];
          return;
        }

        // (b) If key is a “Workers” property (firstName, employeeNumber, etc.),
        //     pull from workerCache
        const wProps = PROPERTY_MAP.Workers.map((p) => p.key);
        if (wProps.includes(key)) {
          if (wid && workerCache.has(wid)) {
            const wd = workerCache.get(wid);
            row[key] = wd ? (wd as any)[key] : '';
          } else {
            row[key] = '';
          }
          return;
        }

        // (c) If you also want “Operations” or “WorkerType” or “PaymentGroup” fields
        //     in the future, you’d check PROPERTY_MAP.Operations, PROPERTY_MAP.WorkerType, etc.
        //     For now, leave them blank:
        row[key] = '';
      });
      allRows.push(row);
    });
  });

  console.debug(`  → built ${allRows.length} output row(s).`);
  return allRows;
}


  /** Export as PDF (just passes row[key]→cell) */
  async exportPDF() {
    const rows = await this.fetchFilteredRows();
    const cols = this.report.fields.map((f) => ({ label: f.label, key: f.key }));

    const logo = '/assets/anebfarming.jpg';
    const from = this.form.value.from;
    const to   = this.form.value.to;
    const name = this.report.name.replace(/\s+/g, '_');

    await this.printSvc.generatePdf({
      reportName: this.report.name,
      from,
      to,
      logoUrl: logo,
      columns: cols,
      rows,
      fileName: `Report_${name}_${formatDate(from)}-${formatDate(to)}`
    });
  }

  /** Export as Excel */
  async exportExcel() {
    const rows = await this.fetchFilteredRows();
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.report.name);
    XLSX.writeFile(wb, `${this.report.name}.xlsx`);
  }

  close() {
    this.dialogRef.close();
  }
}

/** Format a Date as YYYYMMDD (used for fileName) */
function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}
