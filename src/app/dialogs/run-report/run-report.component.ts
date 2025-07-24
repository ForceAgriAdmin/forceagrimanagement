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
import { Association }            from '../../models/reports/association';
import { PrintingService }        from '../../services/printing.service';

import { TransactionsService }    from '../../services/transactions.service';
import { WorkersService }         from '../../services/workerservice.service';
import { OperationService }       from '../../services/operation.service';
import { FarmService }            from '../../services/farm.service';
import { PaymentGroupService }    from '../../services/payment-group.service';
import { WorkerModel }            from '../../models/workers/worker';
import { OperationModel }         from '../../models/operations/operation';

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

  // We'll also cache all operations so we can look up profileImageUrl later
  operations: OperationModel[] = [];

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
      this.ops.getOperations().subscribe(r => {
        this.lookup.Operations = r;
        this.operations = r;   // cache all OperationModel[]
      });
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
   * 1) Read date range from the form
   * 2) Query Firestore for all transactions in that date range
   * 3) Map to rawTxs[]
   * 4) Gather unique IDs (workers, operations, transaction types)
   * 5) Batch‐fetch Worker docs → workerCache
   * 6) Batch‐fetch Operation docs → opMap
   * 7) Batch‐fetch TransactionType docs → txTypeMap
   * 8) In‐memory filter by selected associations
   * 9) Build “detailedRows” (one row per worker per tx), attaching:
   *      row.__workerId   (for grouping)
   *      row._operationId (the first operation ID, for dynamic logo)
   * 10) If summary: group by __workerId, sum amounts, strip helpers, return
   * 11) If not summary: strip helpers and return all rows
   */
  private async fetchFilteredRows(): Promise<any[]> {
    // 1) Read date range
    const fromDate: Date = this.form.value.from;
    const toDate:   Date = this.form.value.to;

    // 2) Query Firestore for all transactions in that date range
    const txCol = collection(this.afs, 'transactions');
    const dateQ = query(
      txCol,
      where('timestamp', '>=', fromDate),
      where('timestamp', '<=', toDate)
    );
    const txSnapshot = await runInInjectionContext(this.injector, () => getDocs(dateQ));

    // 3) Map to rawTxs[]
    const rawTxs = txSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      data: docSnap.data() as any
    }));

    // 4) Gather unique IDs: workers, operations, transaction types
    const workerIdSet = new Set<string>();
    const opIdSet     = new Set<string>();
    const txTypeIdSet = new Set<string>();

    rawTxs.forEach(({ data: tx }) => {
      // 4a) Worker IDs
      if (Array.isArray(tx.workerIds) && tx.workerIds.length) {
        tx.workerIds.forEach((wid: string) => workerIdSet.add(wid));
      }
      else if (typeof tx.workerId === 'string' && tx.workerId) {
        workerIdSet.add(tx.workerId);
      }
      else if (Array.isArray(tx.multiWorkerIds) && tx.multiWorkerIds.length) {
        tx.multiWorkerIds.forEach((wid: string) => workerIdSet.add(wid));
      }

      // 4b) Operation IDs
      if (Array.isArray(tx.operationIds) && tx.operationIds.length) {
        tx.operationIds.forEach((oid: string) => opIdSet.add(oid));
      }
      else if (typeof tx.operationId === 'string' && tx.operationId) {
        opIdSet.add(tx.operationId);
      }

      // 4c) TransactionType ID
      if (typeof tx.transactionTypeId === 'string' && tx.transactionTypeId) {
        txTypeIdSet.add(tx.transactionTypeId);
      }
    });

    // 5) Batch‐fetch Worker docs → workerCache
    const workerCache = new Map<string, WorkerModel|null>();
    const allWorkerIds = Array.from(workerIdSet);
    for (let i = 0; i < allWorkerIds.length; i += 10) {
      const chunk = allWorkerIds.slice(i, i + 10);
      const wq = query(
        collection(this.afs, 'workers'),
        where(documentId(), 'in', chunk)
      );
      const wSnapshot = await runInInjectionContext(this.injector, () => getDocs(wq));
      wSnapshot.docs.forEach(docSnap => {
        workerCache.set(docSnap.id, docSnap.data() as WorkerModel);
      });
      chunk.forEach((wid) => {
        if (!workerCache.has(wid)) {
          workerCache.set(wid, null);
        }
      });
    }

    // 6) Batch‐fetch Operation docs → opMap
    const opMap = new Map<string, OperationModel>();
    const allOpIds = Array.from(opIdSet);
    for (let i = 0; i < allOpIds.length; i += 10) {
      const chunk = allOpIds.slice(i, i + 10);
      const oq = query(
        collection(this.afs, 'operations'),
        where(documentId(), 'in', chunk)
      );
      const oSnapshot = await runInInjectionContext(this.injector, () => getDocs(oq));
      oSnapshot.docs.forEach(docSnap => {
        opMap.set(docSnap.id, docSnap.data() as OperationModel);
      });
      chunk.forEach((oid) => {
        if (!opMap.has(oid)) {
          // Placeholder if not found
          opMap.set(oid, {
            id: oid,
            name: '',
            description: '',
            createdAt: null as any,
            updatedAt: null as any,
            profileImageUrl: ''
          });
        }
      });
    }

    // 7) Batch‐fetch TransactionType docs → txTypeMap
    const txTypeMap = new Map<string, { id: string; name: string }>();
    const allTxTypeIds = Array.from(txTypeIdSet);
    for (let i = 0; i < allTxTypeIds.length; i += 10) {
      const chunk = allTxTypeIds.slice(i, i + 10);
      const tQ = query(
        collection(this.afs, 'transactionTypes'),
        where(documentId(), 'in', chunk)
      );
      const tSnapshot = await runInInjectionContext(this.injector, () => getDocs(tQ));
      tSnapshot.docs.forEach(docSnap => {
        txTypeMap.set(docSnap.id, docSnap.data() as { id: string; name: string });
      });
      chunk.forEach((ttid) => {
        if (!txTypeMap.has(ttid)) {
          txTypeMap.set(ttid, { id: ttid, name: '' });
        }
      });
    }

    // 8) In‐memory filter of rawTxs by each selected association
    const filteredTxs = rawTxs.filter(({ data: tx }) => {
      // 8a) Compute effectiveWorkerIds
      let effectiveWorkerIds: string[] = [];
      if (Array.isArray(tx.workerIds) && tx.workerIds.length) {
        effectiveWorkerIds = tx.workerIds;
      }
      else if (typeof tx.workerId === 'string' && tx.workerId) {
        effectiveWorkerIds = [tx.workerId];
      }
      else if (Array.isArray(tx.multiWorkerIds) && tx.multiWorkerIds.length) {
        effectiveWorkerIds = tx.multiWorkerIds;
      }

      // 8b) Compute effectiveOpIds
      let effectiveOpIds: string[] = [];
      if (Array.isArray(tx.operationIds) && tx.operationIds.length) {
        effectiveOpIds = tx.operationIds;
      }
      else if (typeof tx.operationId === 'string' && tx.operationId) {
        effectiveOpIds = [tx.operationId];
      }

      // 8c) Effective transactionTypeId
      const effectiveTTypeId: string | null = tx.transactionTypeId || null;

      // 8d) Effective PaymentGroupIds (not always used)
      const effectivePGIds: string[] = Array.isArray(tx.paymentGroupIds)
        ? tx.paymentGroupIds
        : [];

      // 8e) Check each chosen association filter:
      for (const a of this.report.associations) {
        const selected: string[] = this.form.value[a] || [];
        if (!Array.isArray(selected) || selected.length === 0) {
          continue; // no filter on this association
        }

        switch (a) {
          case 'Workers':
            if (!selected.some((wid: string) => effectiveWorkerIds.includes(wid))) {
              return false;
            }
            break;

          case 'Operations':
            if (!selected.some((oid: string) => effectiveOpIds.includes(oid))) {
              return false;
            }
            break;

          case 'WorkerType':
            const matchesWorkerType = effectiveWorkerIds.some((wid: string) => {
              const wd = workerCache.get(wid);
              return wd?.workerTypeId && selected.includes(wd.workerTypeId);
            });
            if (!matchesWorkerType) {
              return false;
            }
            break;

          case 'TransactionType':
            if (!effectiveTTypeId || !selected.includes(effectiveTTypeId)) {
              return false;
            }
            break;

          case 'PaymentGroup':
            if (!effectivePGIds.some((pgid: string) => selected.includes(pgid))) {
              return false;
            }
            break;
        }
      }

      return true;
    });

    // 9) Build every “detailed” row (one per worker per transaction),
    //    attaching hidden __workerId and _operationId
    const detailedRows: any[] = [];
    filteredTxs.forEach(({ data: tx }) => {
      // 9a) Recompute effectiveWorkerIds
      let effectiveWorkerIds: string[] = [];
      if (Array.isArray(tx.workerIds) && tx.workerIds.length) {
        effectiveWorkerIds = tx.workerIds;
      }
      else if (typeof tx.workerId === 'string' && tx.workerId) {
        effectiveWorkerIds = [tx.workerId];
      }
      else if (Array.isArray(tx.multiWorkerIds) && tx.multiWorkerIds.length) {
        effectiveWorkerIds = tx.multiWorkerIds;
      }

      // 9b) Recompute effectiveOpIds
      let effectiveOpIds: string[] = [];
      if (Array.isArray(tx.operationIds) && tx.operationIds.length) {
        effectiveOpIds = tx.operationIds;
      }
      else if (typeof tx.operationId === 'string' && tx.operationId) {
        effectiveOpIds = [tx.operationId];
      }

      // 9c) Determine the “first” operation ID (or null if none)
      const firstOpId: string | null = (effectiveOpIds.length ? effectiveOpIds[0] : null);

      // 9d) Recompute effectiveTTypeId & effectivePGIds (as above)
      const effectiveTTypeId: string | null = tx.transactionTypeId || null;
      const effectivePGIds: string[] = Array.isArray(tx.paymentGroupIds)
        ? tx.paymentGroupIds
        : [];

      // If no worker IDs, still output one “blank‐worker” row
      const loopIds = effectiveWorkerIds.length ? effectiveWorkerIds : [null as any];

      loopIds.forEach((wid) => {
        const row: any = {};

        // 9e) Fill in each field from this.report.fields
        this.report.fields.forEach((f) => {
          const key = f.key;

          // If key is a direct tx property except operationId/transactionTypeId, copy it:
          if (key in tx && key !== 'operationId' && key !== 'transactionTypeId') {
            row[key] = tx[key];
            return;
          }

          // If key === 'operationId', replace with opMap.get(firstOpId)?.name
          if (key === 'operationId') {
            if (firstOpId) {
              row[key] = opMap.get(firstOpId)?.name || '';
            } else {
              row[key] = '';
            }
            return;
          }

          // If key === 'transactionTypeId', replace with txTypeMap lookup
          if (key === 'transactionTypeId') {
            if (typeof tx.transactionTypeId === 'string') {
              row[key] = txTypeMap.get(tx.transactionTypeId)?.name || '';
            } else {
              row[key] = '';
            }
            return;
          }

          // If key is one of the Worker properties, pull from workerCache
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

          // Any other key (Operation Description, WorkerType, PaymentGroup, etc.) remains blank:
          row[key] = '';
        });

        // 9f) Attach hidden helper fields:
        (row as any).__workerId   = wid;
        (row as any)._operationId = firstOpId;

        detailedRows.push(row);
      });
    });

    // 10) If summary === true, group by __workerId and sum the “amount”
    if (this.report.summary) {
  const summaryMap = new Map<string, any>();

  detailedRows.forEach((row) => {
    const txType = row['transactionTypeId'] || 'Unknown';

    if (!summaryMap.has(txType)) {
      const cloned = { ...row };
      const rawAmt = cloned.amount;
      const parsed = typeof rawAmt === 'number' ? rawAmt : parseFloat(rawAmt) || 0;
      cloned.amount = parsed;

      // Keep only relevant fields
      for (const key in cloned) {
        if (!['amount', 'transactionTypeId'].includes(key)) {
          delete cloned[key];
        }
      }

      summaryMap.set(txType, cloned);
    } else {
      const existing = summaryMap.get(txType);
      const rawAmt = row.amount;
      const parsed = typeof rawAmt === 'number' ? rawAmt : parseFloat(rawAmt) || 0;
      existing.amount += parsed;
    }
  });

  // Convert Map → array and return
  const summarized: any[] = [];
  summaryMap.forEach((val) => {
    summarized.push(val);
  });
  return summarized;
}

    // 11) If summary === false, strip helpers and return all rows
    const cleaned = detailedRows.map(r => {
      const copy = { ...r };
      delete copy.__workerId;
      delete copy._operationId;
      return copy;
    });
    return cleaned;
  }

  /**
   * Helper that returns the “detailedRows” array before we strip
   * out __workerId and _operationId. We copy exactly the code from
   * fetchFilteredRows() up through where we push into detailedRows[], 
   * then return that detailedRows[] as-is (with helpers intact).
   */

  /** Export as PDF (determines logoUrl dynamically) */
  async exportPDF() {
  const rowsWithIds: any[] = this.report.summary
    ? await this.fetchFilteredRows()
    : await this.getDetailedRowsWithIds();

  const rows = this.report.summary
    ? rowsWithIds
    : rowsWithIds.map(r => {
        const copy = { ...r };
        delete copy.__workerId;
        delete copy._operationId;
        return copy;
      });

  let logoUrl = '/assets/anebfarming.jpg';
  if (!this.report.summary && rowsWithIds.length > 0) {
    const firstOpId = rowsWithIds[0]._operationId as string | null;
    if (firstOpId) {
      const op = this.operations.find(o => o.id === firstOpId);
      if (op?.profileImageUrl) {
        logoUrl = op.profileImageUrl;
      }
    }
  }

  const cols = this.report.fields.map(f => ({ label: f.label, key: f.key }));
  const from = this.form.value.from;
  const to = this.form.value.to;
  const name = this.report.name.replace(/\s+/g, '_');

  await this.printSvc.generatePdf({
    reportName: this.report.name,
    from,
    to,
    employeeNumber: '',
    logoUrl,
    columns: cols,
    rows,
    fileName: `Report_${name}_${formatDate(from)}-${formatDate(to)}`
  });
}

  /** Export as Excel (unchanged) */
  async exportExcel() {
    const rows = await this.fetchFilteredRows();
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.report.name);
    XLSX.writeFile(wb, `${this.report.name}.xlsx`);
  }

  /** Close dialog (unchanged) */
  close() {
    this.dialogRef.close();
  }

  /**
   * Helper: returns “detailedRows” with __workerId + _operationId still intact.
   * We simply re-run the same code from fetchFilteredRows() up through row creation.
   */
  private async getDetailedRowsWithIds(): Promise<any[]> {
    // This method is identical to the first half of fetchFilteredRows(),
    // including building detailedRows[] with __workerId and _operationId,
    // but does NOT strip them. Return that array.

    // 1) Read date range
    const fromDate: Date = this.form.value.from;
    const toDate:   Date = this.form.value.to;

    // 2) Query Firestore
    const txCol = collection(this.afs, 'transactions');
    const dateQ = query(
      txCol,
      where('timestamp', '>=', fromDate),
      where('timestamp', '<=', toDate)
    );
    const txSnapshot = await runInInjectionContext(this.injector, () => getDocs(dateQ));

    // 3) rawTxs
    const rawTxs = txSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      data: docSnap.data() as any
    }));

    // 4) Gather IDs
    const workerIdSet = new Set<string>();
    const opIdSet     = new Set<string>();
    const txTypeIdSet = new Set<string>();

    rawTxs.forEach(({ data: tx }) => {
      // 4a) Worker IDs
      if (Array.isArray(tx.workerIds) && tx.workerIds.length) {
        tx.workerIds.forEach((wid: string) => workerIdSet.add(wid));
      }
      else if (typeof tx.workerId === 'string' && tx.workerId) {
        workerIdSet.add(tx.workerId);
      }
      else if (Array.isArray(tx.multiWorkerIds) && tx.multiWorkerIds.length) {
        tx.multiWorkerIds.forEach((wid: string) => workerIdSet.add(wid));
      }

      // 4b) Operation IDs
      if (Array.isArray(tx.operationIds) && tx.operationIds.length) {
        tx.operationIds.forEach((oid: string) => opIdSet.add(oid));
      }
      else if (typeof tx.operationId === 'string' && tx.operationId) {
        opIdSet.add(tx.operationId);
      }

      // 4c) TransactionType ID
      if (typeof tx.transactionTypeId === 'string' && tx.transactionTypeId) {
        txTypeIdSet.add(tx.transactionTypeId);
      }
    });

    // 5) Batch‐fetch Worker docs
    const workerCache = new Map<string, WorkerModel|null>();
    const allWorkerIds = Array.from(workerIdSet);
    for (let i = 0; i < allWorkerIds.length; i += 10) {
      const chunk = allWorkerIds.slice(i, i + 10);
      const wq = query(
        collection(this.afs, 'workers'),
        where(documentId(), 'in', chunk)
      );
      const wSnapshot = await runInInjectionContext(this.injector, () => getDocs(wq));
      wSnapshot.docs.forEach(docSnap => {
        workerCache.set(docSnap.id, docSnap.data() as WorkerModel);
      });
      chunk.forEach((wid) => {
        if (!workerCache.has(wid)) {
          workerCache.set(wid, null);
        }
      });
    }

    // 6) Batch‐fetch Operation docs → opMap
    const opMap = new Map<string, OperationModel>();
    const allOpIds = Array.from(opIdSet);
    for (let i = 0; i < allOpIds.length; i += 10) {
      const chunk = allOpIds.slice(i, i + 10);
      const oq = query(
        collection(this.afs, 'operations'),
        where(documentId(), 'in', chunk)
      );
      const oSnapshot = await runInInjectionContext(this.injector, () => getDocs(oq));
      oSnapshot.docs.forEach(docSnap => {
        opMap.set(docSnap.id, docSnap.data() as OperationModel);
      });
      chunk.forEach((oid) => {
        if (!opMap.has(oid)) {
          opMap.set(oid, {
            id: oid,
            name: '',
            description: '',
            createdAt: null as any,
            updatedAt: null as any,
            profileImageUrl: ''
          });
        }
      });
    }

    // 7) Batch‐fetch TransactionType docs → txTypeMap
    const txTypeMap = new Map<string, { id: string; name: string }>();
    const allTxTypeIds = Array.from(txTypeIdSet);
    for (let i = 0; i < allTxTypeIds.length; i += 10) {
      const chunk = allTxTypeIds.slice(i, i + 10);
      const tQ = query(
        collection(this.afs, 'transactionTypes'),
        where(documentId(), 'in', chunk)
      );
      const tSnapshot = await runInInjectionContext(this.injector, () => getDocs(tQ));
      tSnapshot.docs.forEach(docSnap => {
        txTypeMap.set(docSnap.id, docSnap.data() as { id: string; name: string });
      });
      chunk.forEach((ttid) => {
        if (!txTypeMap.has(ttid)) {
          txTypeMap.set(ttid, { id: ttid, name: '' });
        }
      });
    }

    // 8) In‐memory filter of rawTxs by each selected association
    const filteredTxs = rawTxs.filter(({ data: tx }) => {
      // 8a) effectiveWorkerIds
      let effectiveWorkerIds: string[] = [];
      if (Array.isArray(tx.workerIds) && tx.workerIds.length) {
        effectiveWorkerIds = tx.workerIds;
      }
      else if (typeof tx.workerId === 'string' && tx.workerId) {
        effectiveWorkerIds = [tx.workerId];
      }
      else if (Array.isArray(tx.multiWorkerIds) && tx.multiWorkerIds.length) {
        effectiveWorkerIds = tx.multiWorkerIds;
      }

      // 8b) effectiveOpIds
      let effectiveOpIds: string[] = [];
      if (Array.isArray(tx.operationIds) && tx.operationIds.length) {
        effectiveOpIds = tx.operationIds;
      }
      else if (typeof tx.operationId === 'string' && tx.operationId) {
        effectiveOpIds = [tx.operationId];
      }

      // 8c) effectiveTTypeId
      const effectiveTTypeId: string | null = tx.transactionTypeId || null;

      // 8d) effectivePGIds
      const effectivePGIds: string[] = Array.isArray(tx.paymentGroupIds)
        ? tx.paymentGroupIds
        : [];

      // 8e) Check chosen associations
      for (const a of this.report.associations) {
        const selected: string[] = this.form.value[a] || [];
        if (!Array.isArray(selected) || selected.length === 0) {
          continue;
        }

        switch (a) {
          case 'Workers':
            if (!selected.some((wid: string) => effectiveWorkerIds.includes(wid))) {
              return false;
            }
            break;

          case 'Operations':
            if (!selected.some((oid: string) => effectiveOpIds.includes(oid))) {
              return false;
            }
            break;

          case 'WorkerType':
            const matchesWorkerType = effectiveWorkerIds.some((wid: string) => {
              const wd = workerCache.get(wid);
              return wd?.workerTypeId && selected.includes(wd.workerTypeId);
            });
            if (!matchesWorkerType) {
              return false;
            }
            break;

          case 'TransactionType':
            if (!effectiveTTypeId || !selected.includes(effectiveTTypeId)) {
              return false;
            }
            break;

          case 'PaymentGroup':
            if (!effectivePGIds.some((pgid: string) => selected.includes(pgid))) {
              return false;
            }
            break;
        }
      }

      return true;
    });

    // 9) Build “detailed” rows, attaching __workerId + _operationId
    const detailedRows: any[] = [];
    filteredTxs.forEach(({ data: tx }) => {
      // 9a) effectiveWorkerIds
      let effectiveWorkerIds: string[] = [];
      if (Array.isArray(tx.workerIds) && tx.workerIds.length) {
        effectiveWorkerIds = tx.workerIds;
      }
      else if (typeof tx.workerId === 'string' && tx.workerId) {
        effectiveWorkerIds = [tx.workerId];
      }
      else if (Array.isArray(tx.multiWorkerIds) && tx.multiWorkerIds.length) {
        effectiveWorkerIds = tx.multiWorkerIds;
      }

      // 9b) effectiveOpIds
      let effectiveOpIds: string[] = [];
      if (Array.isArray(tx.operationIds) && tx.operationIds.length) {
        effectiveOpIds = tx.operationIds;
      }
      else if (typeof tx.operationId === 'string' && tx.operationId) {
        effectiveOpIds = [tx.operationId];
      }

      // 9c) firstOpId
      const firstOpId: string | null = (effectiveOpIds.length ? effectiveOpIds[0] : null);

      // 9d) effectiveTTypeId & effectivePGIds
      const effectiveTTypeId: string | null = tx.transactionTypeId || null;
      const effectivePGIds: string[] = Array.isArray(tx.paymentGroupIds)
        ? tx.paymentGroupIds
        : [];

      // If no worker IDs, still produce a “blank‐worker” row
      const loopIds = effectiveWorkerIds.length ? effectiveWorkerIds : [null as any];

      loopIds.forEach((wid) => {
        const row: any = {};

        // 9e) Fill each field from this.report.fields
        this.report.fields.forEach((f) => {
          const key = f.key;

          // If direct tx property except operationId/transactionTypeId, copy it
          if (key in tx && key !== 'operationId' && key !== 'transactionTypeId') {
            row[key] = tx[key];
            return;
          }

          // If key === 'operationId', replace with opMap.get(firstOpId)?.name
          if (key === 'operationId') {
            if (firstOpId) {
              row[key] = opMap.get(firstOpId)?.name || '';
            } else {
              row[key] = '';
            }
            return;
          }

          // If key === 'transactionTypeId', replace with txTypeMap lookup
          if (key === 'transactionTypeId') {
            if (typeof tx.transactionTypeId === 'string') {
              row[key] = txTypeMap.get(tx.transactionTypeId)?.name || '';
            } else {
              row[key] = '';
            }
            return;
          }

          // If key is one of the Worker properties, pull from workerCache
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

          // Otherwise, blank
          row[key] = '';
        });

        // 9f) Attach helpers:
        (row as any).__workerId   = wid;
        (row as any)._operationId = firstOpId;

        detailedRows.push(row);
      });
    });

    // Return the array WITH helpers still intact
    return detailedRows;
  }
}

/** Helper to format a Date as YYYYMMDD (used in fileName) */
function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}
