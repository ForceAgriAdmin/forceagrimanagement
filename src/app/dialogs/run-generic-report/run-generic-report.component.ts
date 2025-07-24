import { CommonModule, formatDate } from '@angular/common';
import {
  Component,
  Inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  documentId,
} from '@angular/fire/firestore';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { OperationModel } from '../../models/operations/operation';
import { AppReport } from '../../models/reports/appreport';
import { Association } from '../../models/reports/association';
import { WorkerModel } from '../../models/workers/worker';
import { FarmService } from '../../services/farm.service';
import { OperationService } from '../../services/operation.service';
import { PaymentGroupService } from '../../services/payment-group.service';
import { PrintingService } from '../../services/printing.service';
import { TransactionsService } from '../../services/transactions.service';
import { WorkersService } from '../../services/workerservice.service';
import { RunReportComponent } from '../run-report/run-report.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ReportConfig } from '../../models/reports/report-config';
import { TransactionTypeModel } from '../../models/transactions/transactiontype';
import { MatCheckbox } from '@angular/material/checkbox';
@Component({
  selector: 'app-run-generic-report',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatNativeDateModule,
    MatSlideToggle,
  ],
  templateUrl: './run-generic-report.component.html',
  styleUrl: './run-generic-report.component.scss',
})
export class RunGenericReportComponent {
  form!: FormGroup;
  isSummaryReport = false;
  workerSearch: string = '';
  workerSearchControl = new FormControl('');
  filteredWorkers: WorkerModel[] = [];
  isAllSelected = false;
  // We'll also cache all operations so we can look up profileImageUrl later
  operations: OperationModel[] = [];
  workers: WorkerModel[] = [];
  transactionTypes: TransactionTypeModel[] = [];
  end: 'center' | 'start' | 'end' | undefined;

  selectedReportId: string = '';

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
this.filteredWorkers = this.workers;
this.workerSearchControl.valueChanges.subscribe(search => {
    const term = (search || '').toLowerCase();
    this.filteredWorkers = this.workers.filter(w =>
      `${w.employeeNumber} ${w.firstName} ${w.lastName}`.toLowerCase().includes(term)
    );
  });
    this.ts.getTransactionTypes().subscribe((tt) => {
      this.transactionTypes = tt;
    });

    this.ws.getWorkers().subscribe((w) => {
      this.workers = w;
    });

    this.ops.getOperations().subscribe((o) => {
      this.operations = o;
    });

    this.form = this.fb.group({
      from: [null],
      to: [null],
      operationId: [null],
      transactionTypeId: [null],
      workerIds: [[]], // array of selected worker IDs
    });
    
  }
  filterWorkers(): void {
    const search = this.workerSearch.toLowerCase();
    this.filteredWorkers = this.workers.filter((w) =>
      `${w.employeeNumber} ${w.firstName} ${w.lastName}`
        .toLowerCase()
        .includes(search)
    );
  }
  onWorkerSelectionChange(event: MatSelectChange): void {
  const selected = event.value;

  // If 'ALL' was just selected
  if (selected.includes('ALL') && !this.isAllSelected) {
    this.isAllSelected = true;
    const allIds = this.workers.map(w => w.id);
    // ✅ Also include 'ALL' so it's visually selected
    this.form.get('workerIds')?.setValue(['ALL', ...allIds]);
  }

  // If 'ALL' was removed/deselected
  else if (!selected.includes('ALL') && this.isAllSelected) {
    this.isAllSelected = false;
    // ✅ Clear all selections
    this.form.get('workerIds')?.setValue([]);
  }

  // If manually selecting/deselecting workers
  else {
    const workerIds = this.workers.map(w => w.id);
    const selectedWorkersOnly = selected.filter((v: string) => v !== 'ALL');

    // ✅ If all workers manually selected, also add 'ALL'
    if (selectedWorkersOnly.length === workerIds.length) {
      this.isAllSelected = true;
      this.form.get('workerIds')?.setValue(['ALL', ...workerIds]);
    } else {
      this.isAllSelected = false;
      this.form.get('workerIds')?.setValue(selectedWorkersOnly);
    }
  }
}

  exportPDF() {
    switch (this.report.id) {
      case 'CfpmnfyjgO7wMGOIlo1M':
        this.RunWorkersTransaction('pdf');
        break;

      case 'RdnuNONEJaLHGDVLbBW6':
        this.RunTransactionsByType('pdf');
        break;

      case 'XwCir1DGucyvyXVky4U1':
        this.RunWorkersTransactionsByType('pdf');
        break;

      case 'ePkRNUxMLtgJSLhicTw7':
        this.RunWorkerTransaction('pdf');
        break;

      case 'irlKDDfZCD3FmGZvGzin':
        this.RunTransactionsByOperation('pdf');
        break;

      case 'nShxftGr5mqbZjaknMLW':
        this.RunTransaction('pdf');
        break;

      case 'vbB3Uf8DInzuSoOhvVAA':
        this.RunWorkerTransactionsByOperation('pdf');
        break;
    }
  }

  exportExcel() {
    switch (this.report.id) {
      case 'CfpmnfyjgO7wMGOIlo1M':
        this.RunWorkersTransaction('excel');
        break;

      case 'RdnuNONEJaLHGDVLbBW6':
        this.RunTransactionsByType('excel');
        break;

      case 'XwCir1DGucyvyXVky4U1':
        this.RunWorkersTransactionsByType('excel');
        break;

      case 'ePkRNUxMLtgJSLhicTw7':
        this.RunWorkerTransaction('excel');
        break;

      case 'irlKDDfZCD3FmGZvGzin':
        this.RunTransactionsByOperation('excel');
        break;

      case 'nShxftGr5mqbZjaknMLW':
        this.RunTransaction('excel');
        break;

      case 'vbB3Uf8DInzuSoOhvVAA':
        this.RunWorkerTransactionsByOperation('excel');
        break;
    }
  }

  close() {
    this.dialogRef.close();
  }

  RunTransactionsByType(exportType: string) {
    const fromDate: Date = this.form.value.from;
    const toDate: Date = this.form.value.to;
    const employeeNumber =
      this.workers.find((w) => w.id === this.form.value.workerIds[0])
        ?.employeeNumber ?? '';
    //get report data

    this.ts.getTransactionsBetweenDatesForTransactionTypeIdAndOperation(
  this.form.value.transactionTypeId,
  this.form.value.operationId,
  fromDate,
  toDate
)
      .subscribe((data) => {
        if (!data) {
          return;
        }

        var reportConfig: ReportConfig = {
          columns: [
            { label: 'Name' },
            { label: 'Employee Number' },
            { label: 'Date' },
            { label: 'Type' },
            { label: 'Operation' },
            { label: 'Amount' },
          ],
          fileName: `${this.report.name}-${
            this.operations.find((o) => o.id == this.form.value.operationId)
              ?.description
          }`,
          from: fromDate,
          to: toDate,
          employeeNumber: employeeNumber,
          logoUrl:
            this.operations.find((o) => o.id == this.form.value.operationId)
              ?.profileImageUrl ?? '',
          reportName: this.report.name,
          rows: data.map((t) => {
            const worker = this.workers.find((w) => w.id === t.workerIds[0]); // assuming 1 worker per transaction
            const operation = this.operations.find(
              (o) => o.id === t.operationIds[this.form.value.operationId]
            );
            const type = this.transactionTypes.find(
              (tt) => tt.id === t.transactionTypeId
            );

            return {
              Name: worker
                ? `${worker.firstName ?? ''} ${worker.lastName ?? ''}`
                : '',
              'Employee Number': worker?.employeeNumber ?? '',
              Date: t.timestamp.toDate().toLocaleDateString(),
              Type: type?.name ?? '',
              Operation: operation?.name ?? '',
              Amount: t.amount?.toFixed(2) ?? '0.00',
            };
          }),
        };

        switch (exportType) {
          case 'pdf':
            this.printSvc.generatePdf(reportConfig);
            break;

          case 'excel':
            break;
        }
      });
  }
  RunWorkersTransactionsByType(type: string) {
    const fromDate: Date = this.form.value.from;
    const toDate: Date = this.form.value.to;
    if (type == 'pdf') {
    } else {
    }
  }
  RunWorkerTransaction(type: string) {
    const fromDate: Date = this.form.value.from;
    const toDate: Date = this.form.value.to;
    if (type == 'pdf') {
    } else {
    }
  }
  RunTransactionsByOperation(type: string) {
    const fromDate: Date = this.form.value.from;
    const toDate: Date = this.form.value.to;
    if (type == 'pdf') {
    } else {
    }
  }
  RunTransaction(type: string) {
    const fromDate: Date = this.form.value.from;
    const toDate: Date = this.form.value.to;
    if (type == 'pdf') {
    } else {
    }
  }
  RunWorkerTransactionsByOperation(type: string) {
    const fromDate: Date = this.form.value.from;
    const toDate: Date = this.form.value.to;
    if (type == 'pdf') {
    } else {
    }
  }
  RunWorkersTransaction(type: string) {
    const fromDate: Date = this.form.value.from;
    const toDate: Date = this.form.value.to;
    if (type == 'pdf') {
    } else {
    }
  }
}
