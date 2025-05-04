import { Component, Inject, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { WorkerModel } from '../../models/workers/worker';

export interface AddWorkerTransactionDialogData {
  worker?: WorkerModel | null;
}

@Component({
  selector: 'app-add-worker-transaction',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './add-worker-transaction.component.html',
  styleUrl: './add-worker-transaction.component.scss',
})
export class AddWorkerTransactionComponent {
  @Input() worker!: WorkerModel;
  transactionForm: FormGroup;
  
  constructor(
    public dialogRef: MatDialogRef<AddWorkerTransactionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddWorkerTransactionDialogData,
    private fb: FormBuilder
  ) {
    this.transactionForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      idNumber: ['', Validators.required],
      employeeNumber: ['', Validators.required],
      operationId: ['', Validators.required],
    });
  }

  onSubmit(): void {
      this.dialogRef.close();
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
