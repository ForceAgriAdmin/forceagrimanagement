import {
  Component,
  Inject,
  OnInit
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

import { TransactionsService }    from '../../services/transactions.service';
import { WorkersService }         from '../../services/workerservice.service';
import { OperationService }       from '../../services/operation.service';
import { FarmService }            from '../../services/farm.service';
import { PaymentGroupService }    from '../../services/payment-group.service';

import * as XLSX from 'xlsx';
import { AppReport } from '../../models/reports/appreport';
import { Association } from '../../models/reports/association';

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
  dataRows: any[] = [];

  // lookups for each assoc
  lookup: Record<Association, any[]> = {
    Workers: [],
    Operations: [],
    WorkerType: [],
    TransactionType: [],
    PaymentGroup: []
  };
end: "center"|"start"|"end"|undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RunReportComponent>,
    @Inject(MAT_DIALOG_DATA) public report: AppReport,
    private ts: TransactionsService,
    private ws: WorkersService,
    private ops: OperationService,
    private fs: FarmService,
    private pgs: PaymentGroupService
  ) {}

  ngOnInit() {
    const today = new Date();
    const start = this.report.createdAt.toDate();
    this.form = this.fb.group({
      from: [start],
      to:   [today]
    });

    // one control per association
    this.report.associations.forEach(a => this.form.addControl(a, this.fb.control([])));

    // preload lookups
    if (this.report.associations.includes('Workers'))
      this.ws.getWorkers().subscribe(r => (this.lookup.Workers = r));
    if (this.report.associations.includes('Operations'))
      this.ops.getOperations().subscribe(r => (this.lookup.Operations = r));
    if (this.report.associations.includes('WorkerType'))
      this.ws.getWorkerTypes!().subscribe(r => (this.lookup.WorkerType = r));
    if (this.report.associations.includes('TransactionType'))
      this.ts.getTransactionTypes().subscribe(r => (this.lookup.TransactionType = r));
    if (this.report.associations.includes('PaymentGroup'))
      this.pgs.getGroups().subscribe(r => (this.lookup.PaymentGroup = r));
  }

  run() {
    this.ts.getTransactions().subscribe(all => {
      // date filter
      let rows = all.filter(t => {
        const d = t.timestamp.toDate();
        return d >= this.form.value.from && d <= this.form.value.to;
      });

      // each assoc narrows the tx set
      this.report.associations.forEach((a: Association) => {
        const sel: string[] = this.form.value[a] || [];
        if (!sel.length) return;
        switch (a) {
          case 'Workers':
            rows = rows.filter(r => sel.includes(r.workerId));
            break;
          case 'Operations':
            rows = rows.filter(r => sel.includes(r.operationId));
            break;
          case 'WorkerType':
            // assume WorkerModel has 'workerTypeId'
            rows = rows.filter(r => {
              const w = this.lookup.Workers.find(x => x.id === r.workerId);
              return w && sel.includes(w.workerTypeId);
            });
            break;
          case 'TransactionType':
            rows = rows.filter(r => sel.includes(r.transactionTypeId));
            break;
          case 'PaymentGroup':
            // union of all selected group.workerIds
            const allIds = sel
              .flatMap(gid => this.lookup.PaymentGroup.find(g => g.id === gid)?.workerIds || []);
            rows = rows.filter(r => allIds.includes(r.workerId));
            break;
        }
      });

      // project to chosen fields
      this.dataRows = rows.map(r => {
        const out: any = {};
        this.report.fields.forEach(f => (out[f.label] = (r as any)[f.key]));
        return out;
      });
    });
  }

  exportPDF() {
    const w = window.open('', '_blank')!;
    w.document.write(`
      <h1>${this.report.name}</h1>
      <p>From: ${this.form.value.from.toLocaleDateString()} 
         To: ${this.form.value.to.toLocaleDateString()}</p>
      <table border="1" cellpadding="4">
        <thead><tr>${this.report.fields.map(f => `<th>${f.label}</th>`).join('')}</tr></thead>
        <tbody>${this.dataRows.map(row =>
          `<tr>${this.report.fields.map(f => `<td>${row[f.label]||''}</td>`).join('')}</tr>`
        ).join('')}</tbody>
      </table>
    `);
    w.document.close();
    w.print();
  }

  exportExcel() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataRows);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.report.name);
    XLSX.writeFile(wb, `${this.report.name}.xlsx`);
  }

  close() {
    this.dialogRef.close();
  }
}
