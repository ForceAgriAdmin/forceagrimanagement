import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

import { TransactionsService } from '../../services/transactions.service';
import { WorkersService } from '../../services/workerservice.service';
import { PaymentGroupService } from '../../services/payment-group.service';

import { TransactionModel } from '../../models/transactions/transaction';
import { TransactionTypeModel } from '../../models/transactions/transactiontype';
import { WorkerModel } from '../../models/workers/worker';
import { PaymentGroupRecord } from '../../models/payment-groups/payment-group-record';

@Component({
  selector: 'app-edit-transaction',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './edit-transaction.component.html',
  styleUrls: ['./edit-transaction.component.scss'],
})
export class EditTransactionComponent implements OnInit {
  transactionForm: FormGroup;
  transactionTypes: TransactionTypeModel[] = [];
  workers: WorkerModel[] = [];
  paymentGroups: PaymentGroupRecord[] = [];

  constructor(
    public dialogRef: MatDialogRef<EditTransactionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { transaction: TransactionModel },
    private fb: FormBuilder,
    private transactionService: TransactionsService,
    private workersService: WorkersService,
    private pgService: PaymentGroupService
  ) {
    this.transactionForm = this.fb.group({
      function: ['', Validators.required],
      transactionTypeId: ['', Validators.required],
      workerIds: [[]],
      paymentGroupId: [''],
      description: [''],
      amount: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit(): void {
    const tx = this.data.transaction;

    this.transactionForm.patchValue({
      function: tx.function,
      transactionTypeId: tx.transactionTypeId,
      workerIds: tx.workerIds,
      paymentGroupId: tx.paymentGroupIds?.[0] || '',
      description: tx.description,
      amount: tx.amount,
    });

    this.transactionService.getTransactionTypes().subscribe((types) => {
      this.transactionTypes = types;
    });

    this.workersService.getWorkers().subscribe((ws) => {
      this.workers = ws;
    });

    this.pgService.getGroups().subscribe((pg) => {
      this.paymentGroups = pg;
    });

    this.adjustValidation(tx.function as 'single' | 'bulk' | 'payment-group');
  }

  onFunctionChange(): void {
    const fn = this.transactionForm.get('function')?.value;
    this.adjustValidation(fn);
  }

  adjustValidation(fn: 'single' | 'bulk' | 'payment-group'): void {
    const wCtrl = this.transactionForm.get('workerIds')!;
    const pgCtrl = this.transactionForm.get('paymentGroupId')!;

    if (fn === 'bulk') {
      wCtrl.setValidators([Validators.required]);
      pgCtrl.clearValidators();
    } else if (fn === 'payment-group') {
      wCtrl.clearValidators();
      pgCtrl.setValidators([Validators.required]);
    } else {
      wCtrl.setValidators([Validators.required]);
      pgCtrl.clearValidators();
    }

    wCtrl.updateValueAndValidity();
    pgCtrl.updateValueAndValidity();
  }

  async onSubmit(): Promise<void> {
    if (this.transactionForm.invalid) {
      return;
    }

    const fn = this.transactionForm.value.function;

    const updatedTx: TransactionModel = {
      ...this.data.transaction,
      function: fn,
      amount: this.transactionForm.value.amount,
      description: this.transactionForm.value.description,
      transactionTypeId: this.transactionForm.value.transactionTypeId,
    };

    if (fn === 'single') {
      const id = this.transactionForm.value.workerIds;
      updatedTx.workerIds = [id];
      updatedTx.paymentGroupIds = [];
    } else if (fn === 'bulk') {
      updatedTx.workerIds = this.transactionForm.value.workerIds;
      updatedTx.paymentGroupIds = [];
    } else if (fn === 'payment-group') {
      const pgId = this.transactionForm.value.paymentGroupId;
      updatedTx.paymentGroupIds = [pgId];
      const group = this.paymentGroups.find((g) => g.id === pgId);
      updatedTx.workerIds = group?.workerIds || [];
    }

    try {
      await this.transactionService.updateTransaction(this.data.transaction.id,updatedTx);
      this.dialogRef.close(true);
    } catch (err) {
      console.error('Update Transaction failed', err);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
