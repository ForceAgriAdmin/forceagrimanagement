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

import {
  MatIconModule
} from '@angular/material/icon';
import { MatFormFieldModule }  from '@angular/material/form-field';
import { MatInputModule }      from '@angular/material/input';
import { MatSelectModule }     from '@angular/material/select';
import { MatButtonModule }     from '@angular/material/button';
import { AppReport } from '../../models/reports/appreport';
import { ReportsService } from '../../services/report.service';
import { Association } from '../../models/reports/association';

// restricted set of associations
const ALL_ASSOCIATIONS: Association[] = [
  'Workers',
  'Operations',
  'WorkerType',
  'TransactionType',
  'PaymentGroup'
];

// only transaction‐based fields available to return
const PROPERTY_MAP: Record<
  Association,
  { key: string; label: string }[]
> = {
  Workers: [
    { key: 'workerId',    label: 'Worker ID' },
    { key: 'creatorId',   label: 'Creator ID' }
  ],
  Operations: [
    { key: 'operationId', label: 'Operation ID' }
  ],
  WorkerType: [
    { key: 'workerTypeId', label: 'Worker Type ID' }
  ],
  TransactionType: [
    { key: 'transactionTypeId', label: 'Transaction Type ID' }
  ],
  PaymentGroup: [
    // paymentGroup itself isn’t on the transaction, we’ll filter by workerId membership
    // but not expose as a return field here
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
    MatIconModule
  ],
  templateUrl: './add-report.component.html',
  styleUrls: ['./add-report.component.scss']
})
export class AddReportComponent implements OnInit {
  form!: FormGroup;
  ALL_ASSOCIATIONS = ALL_ASSOCIATIONS;
  availableProperties: { key: string; label: string }[] = [];
end: "center"|"start"|"end"|undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddReportComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppReport | null,
    private svc: ReportsService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name:         [this.data?.name || '', Validators.required],
      description:  [this.data?.description || ''],
      associations: [this.data?.associations || [], Validators.required],
      fields:       this.fb.array(
        (this.data?.fields || []).map(f =>
          this.fb.group({
            key:   [f.key,   Validators.required],
            label: [f.label, Validators.required]
          })
        )
      )
    });

    // initialize the property dropdown
    this.updateProps(this.form.value.associations);

    // whenever associations change, update props and prune invalid fields
    this.form.get('associations')!.valueChanges.subscribe((assocs: Association[]) => {
      this.updateProps(assocs);
      const valid = this.availableProperties.map(p => p.key);
      const arr = this.fieldsArray;
      for (let i = arr.length - 1; i >= 0; i--) {
        const k = arr.at(i).get('key')!.value;
        if (!valid.includes(k)) arr.removeAt(i);
      }
    });
  }

  private updateProps(assocs: Association[]) {
    this.availableProperties = assocs
      .flatMap(a => PROPERTY_MAP[a] || [])
      .reduce((acc, cur) => acc.find((x: { key: string; }) => x.key === cur.key) ? acc : [...acc, cur], [] as any);
  }

  get fieldsArray(): FormArray {
    return this.form.get('fields') as FormArray;
  }

  addField() {
    this.fieldsArray.push(
      this.fb.group({ key: ['', Validators.required], label: ['', Validators.required] })
    );
  }

  removeField(i: number) {
    this.fieldsArray.removeAt(i);
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: Omit<AppReport, 'id' | 'createdAt' | 'updatedAt'> = {
      name:         v.name,
      description:  v.description,
      associations: v.associations,
      fields:       v.fields
    };
    const obs = this.data
      ? this.svc.updateReport(this.data.id, payload)
      : this.svc.createReport(payload);

    obs.subscribe(() => this.dialogRef.close(true));
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
