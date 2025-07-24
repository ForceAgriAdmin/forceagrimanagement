import {
  Component,
  Inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormArray
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule }          from '@angular/material/icon';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { MatSelectModule }        from '@angular/material/select';
import { MatButtonModule }        from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AppReport }              from '../../models/reports/appreport';
import { ReportsService }         from '../../services/report.service';
import { Association }            from '../../models/reports/association';
import { AppGenericReport } from '../../models/reports/appgenericreport';

// always-include these transaction fields first:
const BASE_TRANSACTION_FIELDS = [
  { key: 'amount',       label: 'Amount' },
  { key: 'description',  label: 'Description' },
  { key: 'function',     label: 'Function' },
  { key: 'transactionTypeId', label: 'Transaction Type' },
  { key: 'operationId',       label: 'Operation Name' }
];

// only these five associations allowed
const ALL_ASSOCIATIONS: Association[] = [
  'Workers',
  'Operations',
  'WorkerType',
  'TransactionType',
  'PaymentGroup'
];

/**
 * Only human-readable, non-ID fields here.
 * (we never add raw IDs as report columns)
 */
const PROPERTY_MAP: Record<Association, { key: string; label: string }[]> = {
  Workers: [
    { key: 'firstName',      label: 'First Name' },
    { key: 'lastName',       label: 'Last Name' },
    { key: 'idNumber',       label: 'ID Number' },
    { key: 'employeeNumber', label: 'Employee #' }
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
  selector: 'app-add-edit-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './add-report.component.html',
  styleUrls: ['./add-report.component.scss']
})
export class AddReportComponent implements OnInit {
  form!: FormGroup;
  ALL_ASSOCIATIONS = ALL_ASSOCIATIONS;
  availableProperties: { key: string; label: string }[] = [];
  end: 'center' | 'start' | 'end' | undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddReportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppGenericReport | null,
    private svc: ReportsService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name:         [this.data?.name || '', Validators.required],
      description:  [this.data?.description || ''],
      summary: [this.data?.summary ?? false]
    });

    ;
  }


  save() {
    if (this.form.invalid) return;
    const v = this.form.value;

    const payload: Omit<AppGenericReport, 'id' | 'createdAt' | 'updatedAt' | 'isWorkerReport' | 'isOperationReport' | 'isTransactionTypeReport'> = {
      name:         v.name,
      description:  v.description,
      summary:      v.summary
    };

    const obs = this.data
      ? this.svc.updateGenericReport(this.data.id, payload)
      : this.svc.createGenericReport(payload);

    obs.subscribe(() => this.dialogRef.close(true));
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
