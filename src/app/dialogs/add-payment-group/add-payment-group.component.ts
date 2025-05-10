// src/app/dialogs/add-payment-group/add-payment-group.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatSelectModule }    from '@angular/material/select';
import { debounceTime, startWith } from 'rxjs';

import { WorkersService }      from '../../services/workerservice.service';
import { PaymentGroupService } from '../../services/payment-group.service';
import { WorkerModel }         from '../../models/workers/worker';

export interface PaymentGroupDialogData {
  id?: string;
  description?: string;
  workerIds?: string[];
}

@Component({
  selector: 'app-add-payment-group',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './add-payment-group.component.html',
  styleUrls: ['./add-payment-group.component.scss']
})
export class AddPaymentGroupComponent implements OnInit {
  groupForm!: FormGroup;
  allWorkers: WorkerModel[] = [];
  filteredWorkers: WorkerModel[] = [];
  searchCtrl = new FormControl('');

  isEdit = false;
  public data: PaymentGroupDialogData;
end: "center"|"start"|"end"|undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddPaymentGroupComponent>,
    @Inject(MAT_DIALOG_DATA) rawData: PaymentGroupDialogData | null,
    private ws: WorkersService,
    private pgService: PaymentGroupService
  ) {
    this.data = rawData ?? {};
    this.isEdit = typeof this.data.id === 'string';
  }

  ngOnInit(): void {
    // 1) load all workers once
    this.ws.getWorkers().subscribe(ws => {
      this.allWorkers      = ws;
      this.filteredWorkers = ws;
    });

    // 2) filter as user types
    this.searchCtrl.valueChanges
      .pipe(startWith(''), debounceTime(200))
      .subscribe(term => {
        const lower = (term || '').toLowerCase();
        this.filteredWorkers = this.allWorkers.filter(w =>
          (`${w.firstName} ${w.lastName}`)
            .toLowerCase()
            .includes(lower)
        );
      });

    // 3) build the rest of the form
    this.groupForm = this.fb.group({
      description: [this.data.description || '', Validators.required],
      workerIds:   [this.data.workerIds   || []]
    });
  }

  /** clear search when panel opens */
  onSelectOpened(opened: boolean) {
    if (opened) {
      this.searchCtrl.setValue('');
    }
  }

  /** select/deselect all */
  toggleAll() {
    const ids = this.groupForm.value.workerIds as string[];
    if (ids.length === this.allWorkers.length) {
      this.groupForm.patchValue({ workerIds: [] });
    } else {
      this.groupForm.patchValue({
        workerIds: this.allWorkers.map(w => w.id)
      });
    }
  }

  save() {
    const { description, workerIds } = this.groupForm.value;
    if (this.isEdit && this.data.id) {
      this.pgService
        .editGroup(this.data.id, { description, workerIds })
        .subscribe(() =>
          this.dialogRef.close({ id: this.data.id!, description, workerIds })
        );
    } else {
      this.pgService
        .createGroup({ description, workerIds })
        .subscribe(rec => this.dialogRef.close(rec));
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
