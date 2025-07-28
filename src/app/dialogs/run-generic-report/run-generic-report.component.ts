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
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
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
import { AppGenericReport } from '../../models/reports/appgenericreport';
import { NotificationService } from '../../services/notification.service';
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
  isWorkerReport = false;
  // We'll also cache all operations so we can look up profileImageUrl later
  operations: OperationModel[] = [];
  workers: WorkerModel[] = [];
  transactionTypes: TransactionTypeModel[] = [];
  end: 'center' | 'start' | 'end' | undefined;

  selectedReportId: string = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RunReportComponent>,
    @Inject(MAT_DIALOG_DATA) public report: AppGenericReport,
    private afs: Firestore,
    private printSvc: PrintingService,
    private ts: TransactionsService,
    private ws: WorkersService,
    private ops: OperationService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    const today = new Date();
    const start = this.report.createdAt.toDate();

    this.filteredWorkers = this.workers;

    this.workerSearchControl.valueChanges.subscribe((search) => {
      const term = (search || '').toLowerCase();
      this.filteredWorkers = this.workers.filter((w) =>
        `${w.employeeNumber} ${w.firstName} ${w.lastName}`
          .toLowerCase()
          .includes(term)
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
      workerIds: [[]],
      workerId: [null],
      summarize: [false]
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

    // Handle multi-select (array)
    if (Array.isArray(selected)) {
      // If 'ALL' was just selected
      if (selected.includes('ALL') && !this.isAllSelected) {
        this.isAllSelected = true;
        const allIds = this.workers.map((w) => w.id);
        this.form.get('workerIds')?.setValue(['ALL', ...allIds]);
      }
      // If 'ALL' was removed
      else if (!selected.includes('ALL') && this.isAllSelected) {
        this.isAllSelected = false;
        this.form.get('workerIds')?.setValue([]);
      }
      // If manually selecting workers
      else {
        const workerIds = this.workers.map((w) => w.id);
        const selectedWorkersOnly = selected.filter((v: string) => v !== 'ALL');

        if (selectedWorkersOnly.length === workerIds.length) {
          this.isAllSelected = true;
          this.form.get('workerIds')?.setValue(['ALL', ...workerIds]);
        } else {
          this.isAllSelected = false;
          this.form.get('workerIds')?.setValue(selectedWorkersOnly);
        }
      }
    }

    // Handle single-select (string)
    else {
      this.form.get('workerIds')?.setValue([selected]);
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
  const operationId = this.form.value.operationId;
  const transactionTypeId = this.form.value.transactionTypeId;
  const summarize = this.form.value.summarize === true;

  const operation = this.operations.find((o) => o.id === operationId);
  const typeInfo = this.transactionTypes.find(tt => tt.id === transactionTypeId);

  this.ts
    .getTransactionsBetweenDatesForTransactionTypeIdAndOperation(
      transactionTypeId,
      operationId,
      fromDate,
      toDate
    )
    .subscribe((data) => {
      if (!data || data.length === 0) {
        this.notify.showError("No Data found for this request");
        return;
      }

      let reportRows: any[] = [];

      if (summarize) {
        const groupedByWorker = new Map<string, typeof data>();

        for (const tx of data) {
          const workerId = tx.workerIds[0];
          if (!groupedByWorker.has(workerId)) {
            groupedByWorker.set(workerId, []);
          }
          groupedByWorker.get(workerId)?.push(tx);
        }

        for (const [workerId, transactions] of groupedByWorker.entries()) {
          const worker = this.workers.find(w => w.id === workerId);
          const totalAmount = transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);

          reportRows.push({
            Name: `${worker?.firstName ?? ''} ${worker?.lastName ?? ''}`,
            'Employee Number': worker?.employeeNumber ?? '',
            Date: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`,
            Type: typeInfo?.name ?? '',
            Operation: operation?.name ?? '',
            Amount: totalAmount.toFixed(2),
          });
        }

        reportRows.sort((a, b) => a.Name.localeCompare(b.Name));
      } else {
        reportRows = data.map((t) => {
          const worker = this.workers.find((w) => w.id === t.workerIds[0]);
          const type = this.transactionTypes.find(tt => tt.id === t.transactionTypeId);
          return {
            Name: `${worker?.firstName ?? ''} ${worker?.lastName ?? ''}`,
            'Employee Number': worker?.employeeNumber ?? '',
            Date: t.timestamp.toDate().toLocaleDateString(),
            Type: type?.name ?? '',
            Operation: operation?.name ?? '',
            Amount: t.amount?.toFixed(2) ?? '0.00',
          };
        });
      }

      const reportConfig: ReportConfig = {
        columns: [
          { label: 'Name' },
          { label: 'Employee Number' },
          { label: 'Date' },
          { label: 'Type' },
          { label: 'Operation' },
          { label: 'Amount' },
        ],
        fileName: `${this.report.name}-${operation?.description ?? ''}`,
        from: fromDate,
        to: toDate,
        employeeNumber: '',
        logoUrl: operation?.profileImageUrl ?? '',
        reportName: this.report.name,
        rows: reportRows,
      };

      if (exportType === 'pdf') {
        this.printSvc.generatePdf(reportConfig);
      } else if (exportType === 'excel') {
        // this.printSvc.generateExcel?.(reportConfig);
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
  const workerId = this.form.value.workerId;
  const operationId = this.form.value.operationId;
  const transactionTypeId = this.form.value.transactionTypeId;
  const summarize = this.form.value.summarize === true;

  const worker = this.workers.find((w) => w.id === workerId);
  const operation = this.operations.find((o) => o.id === operationId);
  const employeeNumber = worker?.employeeNumber ?? '';

  this.ts
    .getWorkerTransactionsByTypeAndOperationBetweenDates(
      workerId,
      transactionTypeId,
      operationId,
      fromDate,
      toDate
    )
    .subscribe((data) => {
      if (!data || data.length === 0) {
        this.notify.showError("No Data found for this request");
        return;
      }

      const typeInfo = this.transactionTypes.find(tt => tt.id === transactionTypeId);
      const reportRows = summarize
        ? [{
            Name: `${worker?.firstName ?? ''} ${worker?.lastName ?? ''}`,
            'Employee Number': employeeNumber,
            Date: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`,
            Type: typeInfo?.name ?? '',
            Operation: operation?.name ?? '',
            Amount: data.reduce((sum, t) => sum + (t.amount ?? 0), 0).toFixed(2),
          }]
        : data.map((t) => {
            const workerEntry = this.workers.find((w) => w.id === t.workerIds[0]);
            const type = this.transactionTypes.find(tt => tt.id === t.transactionTypeId);
            return {
              Name: `${workerEntry?.firstName ?? ''} ${workerEntry?.lastName ?? ''}`,
              'Employee Number': workerEntry?.employeeNumber ?? '',
              Date: t.timestamp.toDate().toLocaleDateString(),
              Type: type?.name ?? '',
              Operation: operation?.name ?? '',
              Amount: t.amount?.toFixed(2) ?? '0.00',
            };
          });

      const reportConfig: ReportConfig = {
        columns: [
          { label: 'Name' },
          { label: 'Employee Number' },
          { label: 'Date' },
          { label: 'Type' },
          { label: 'Operation' },
          { label: 'Amount' },
        ],
        isWorkerReport: true,
        workerName: `${worker?.firstName ?? ''} ${worker?.lastName ?? ''}`,
        operationName: operation?.name ?? '',
        fileName: `${this.report.name}-${operation?.description ?? ''}`,
        from: fromDate,
        to: toDate,
        employeeNumber: employeeNumber,
        logoUrl: operation?.profileImageUrl ?? '',
        reportName: this.report.name,
        rows: reportRows,
      };

      if (type === 'pdf') {
        this.printSvc.generatePdf(reportConfig);
      } else if (type === 'excel') {
        //this.printSvc.generateExcel?.(reportConfig);
      }
    });
}

}
