// src/app/dialogs/add-transaction/add-transaction.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { Router, RouterModule } from '@angular/router';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { TransactionsService } from '../../services/transactions.service';
import { AuthService } from '../../services/auth.service';
import { WorkersService } from '../../services/workerservice.service';
import { PaymentGroupService } from '../../services/payment-group.service';

import { TransactionModel } from '../../models/transactions/transaction';
import { TransactionTypeModel } from '../../models/transactions/transactiontype';
import { WorkerModel } from '../../models/workers/worker';
import { AppUser } from '../../models/users/user.model';
import { firstValueFrom } from 'rxjs';
import { PaymentGroupRecord } from '../../models/payment-groups/payment-group-record';

@Component({
  selector: 'app-add-transaction',
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
  templateUrl: './add-transaction.component.html',
  styleUrls: ['./add-transaction.component.scss'],
})
export class AddTransactionComponent implements OnInit {
  transactionForm: FormGroup;
  transactionTypes: TransactionTypeModel[] = [];
  workers: WorkerModel[] = [];
  worker!: WorkerModel;
  paymentGroups: PaymentGroupRecord[] = [];
  loggedInUser: AppUser = {
    uid: '',
    email: '',
    displayName: '',
    createdAt: Timestamp.now(),
    farmId: '',
    roles: [],
  };

  constructor(
    public dialogRef: MatDialogRef<AddTransactionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private transactionService: TransactionsService,
    private authService: AuthService,
    private router: Router,
    private workersService: WorkersService,
    private pgService: PaymentGroupService
  ) {
    this.transactionForm = this.fb.group({
      function: ['single', Validators.required],
      operationId: [''],
      workerIds: [[]],
      paymentGroupId: [''], // <— new control
      transactionTypeId: ['', Validators.required],
      description: [''],
      amount: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit(): void {
    this.authService.currentUserDoc$.subscribe((user) => {
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.loggedInUser = user;
      }
    });

    // load dropdown data
    this.transactionService.getTransactionTypes().subscribe((types) => {
      this.transactionTypes = types;
      this.transactionTypes = this.transactionTypes.filter(
        (tt) => tt.name.toLowerCase() !== 'settle'
      );
    });

    this.workersService.getWorkers().subscribe((ws) => (this.workers = ws));

    this.pgService.getGroups().subscribe((pg) => (this.paymentGroups = pg));

    // adjust validations when function changes
    this.transactionForm.get('function')!.valueChanges.subscribe((fn) => {
      const wCtrl = this.transactionForm.get('workerIds')!;
      const pgCtrl = this.transactionForm.get('paymentGroupId')!;

      if (fn === 'bulk') {
        wCtrl.setValidators([Validators.required]);
        pgCtrl.clearValidators();
      } else if (fn === 'payment-group') {
        wCtrl.clearValidators();
        pgCtrl.setValidators([Validators.required]);
      } else {
        // single
        wCtrl.setValidators([Validators.required]);
        pgCtrl.clearValidators();
      }
      wCtrl.updateValueAndValidity();
      pgCtrl.updateValueAndValidity();
    });
  }

  async onSubmit(): Promise<void> {
    if (this.transactionForm.invalid) {
      return;
    }

    const fn = this.transactionForm.value.function as
      | 'single'
      | 'bulk'
      | 'payment-group';

    const baseTx: Omit<
      TransactionModel,
      'id' | 'workerIds' | 'workerTypesIds' | 'paymentGroupIds' | 'operationIds'
    > = {
      timestamp: Timestamp.now(),
      amount: this.transactionForm.value.amount,
      description: this.transactionForm.value.description,
      transactionTypeId: this.transactionForm.value.transactionTypeId,
      creatorId: this.loggedInUser.uid,
      farmId: this.loggedInUser.farmId,
      isSettleTransaction: false,
      function: fn,
    };

    const tx: TransactionModel = {
      ...baseTx,
      id: '',
      workerIds: [],
      workerTypesIds: [],
      paymentGroupIds: [],
      operationIds: [],
    };

    if (fn === 'single') {
      tx.workerIds.push(this.transactionForm.value.workerIds);
      const id = tx.workerIds[0];
      const w = await firstValueFrom(this.workersService.getWorker(id));
      if (w) {
        tx.operationIds = [w.operationId];
        tx.workerTypesIds = [w.workerTypeId];
        tx.paymentGroupIds = w.paymentGroupIds ?? [];
      }
    } else if (fn === 'bulk') {
      const bulkIds = this.transactionForm.value.workerIds as string[];
      tx.workerIds = bulkIds;

      const workers = await firstValueFrom(
        this.workersService.getWorkersById(bulkIds)
      );
      const opSet = new Set<string>();
      const wtSet = new Set<string>();
      const pgSet = new Set<string>();

      workers.forEach((w: WorkerModel) => {
        opSet.add(w.operationId);
        wtSet.add(w.workerTypeId);
        (w.paymentGroupIds || []).forEach((pg) => pgSet.add(pg));
      });

      tx.operationIds = Array.from(opSet);
      tx.workerTypesIds = Array.from(wtSet);
      tx.paymentGroupIds = Array.from(pgSet);
    } else {
      const pgId = this.transactionForm.value.paymentGroupId as string;
      const group = this.paymentGroups.find((g) => g.id === pgId);
      tx.workerIds = group?.workerIds || [];

      if (tx.workerIds.length > 0) {
        const workers = await firstValueFrom(
          this.workersService.getWorkersById(tx.workerIds)
        );

        const opSet = new Set<string>();
        const wtSet = new Set<string>();
        const pgSet = new Set<string>();

        workers.forEach((w: WorkerModel) => {
          opSet.add(w.operationId);
          wtSet.add(w.workerTypeId);
          (w.paymentGroupIds || []).forEach((pg) => pgSet.add(pg));
        });

        tx.operationIds = Array.from(opSet);
        tx.workerTypesIds = Array.from(wtSet);
        tx.paymentGroupIds = Array.from(pgSet);
      }
    }

    try {
      const workerBeforeTransaction = this.worker;
      const newTxId = await this.transactionService.createTransaction(tx);

      if (tx.function === 'single') {
        const createdTx = await firstValueFrom(
          this.transactionService.getTransactionById(newTxId)
        );

        const typeRec = await firstValueFrom(
          this.transactionService.getTransactionTypeById(
            createdTx.transactionTypeId
          )
        );

        //if (typeRec.name.toLowerCase() === 'shop') {
          await this.transactionService.PrintTransactionSlip(createdTx,workerBeforeTransaction);
        //}
      }

      this.dialogRef.close(true);
    } catch (err) {
      console.error('Create Transaction failed', err);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
