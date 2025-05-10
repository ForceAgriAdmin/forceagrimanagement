// src/app/dialogs/add-transaction/add-transaction.component.ts
import { Component, Inject, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Timestamp } from "@angular/fire/firestore";
import { Router, RouterModule } from "@angular/router";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule }  from "@angular/material/form-field";
import { MatInputModule }      from "@angular/material/input";
import { MatSelectModule }     from "@angular/material/select";
import { MatButtonModule }     from "@angular/material/button";

import { TransactionsService }   from "../../services/transactions.service";
import { AuthService }           from "../../services/auth.service";
import { WorkersService }        from "../../services/workerservice.service";
import { PaymentGroupRecord, PaymentGroupService }   from "../../services/payment-group.service";

import { TransactionModel }      from "../../models/transactions/transaction";
import { TransactionTypeModel }  from "../../models/transactions/transactiontype";
import { WorkerModel }           from "../../models/workers/worker";
import { AppUser }               from "../../models/users/user.model";

@Component({
  selector: "app-add-transaction",
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
  templateUrl: "./add-transaction.component.html",
  styleUrls: ["./add-transaction.component.scss"],
})
export class AddTransactionComponent implements OnInit {
  transactionForm: FormGroup;
  transactionTypes: TransactionTypeModel[] = [];
  workers: WorkerModel[] = [];
  paymentGroups: PaymentGroupRecord[] = [];
  loggedInUser: AppUser = {
    uid: "",
    email: "",
    displayName: "",
    createdAt: Timestamp.now(),
    farmId: "",
    roles: []
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
      function:            ["single", Validators.required],
      operationId:         ["", Validators.required],
      workerIds:           [[], Validators.required],
      paymentGroupId:      [""],             // <— new control
      transactionTypeId:   ["", Validators.required],
      description:         ["", Validators.required],
      amount:              ["", [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit(): void {
   this.authService.currentUserDoc$.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.loggedInUser = user;
      }
    });

    // load dropdown data
    this.transactionService
      .getTransactionTypes()
      .subscribe(types => (this.transactionTypes = types));

    this.workersService
      .getWorkers()
      .subscribe(ws => (this.workers = ws));

    this.pgService
      .getGroups()
      .subscribe(pg => (this.paymentGroups = pg));

    // adjust validations when function changes
    this.transactionForm.get("function")!.valueChanges.subscribe(fn => {
      const wCtrl = this.transactionForm.get("workerIds")!;
      const pgCtrl = this.transactionForm.get("paymentGroupId")!;

      if (fn === "bulk") {
        wCtrl.setValidators([Validators.required]);
        pgCtrl.clearValidators();
      } else if (fn === "payment-group") {
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
    if (this.transactionForm.invalid) return;

    const fn = this.transactionForm.value.function as
      | "single"
      | "bulk"
      | "payment-group";

    const baseTx: Omit<TransactionModel, "workerId" | "multiWorkerId"> = {
      timestamp:         Timestamp.now(),
      amount:            +this.transactionForm.value.amount,
      description:       this.transactionForm.value.description,
      transactionTypeId: this.transactionForm.value.transactionTypeId,
      creatorId:         this.loggedInUser.uid,
      operationId:       this.transactionForm.value.operationId,
      function:          fn,
    };

    const tx: TransactionModel = {
      ...baseTx,
      workerId:      "",
      multiWorkerId: [],
    };

    if (fn === "single") {
      const arr = this.transactionForm.value.workerIds as string[];
      tx.workerId = arr[0];
    } else if (fn === "bulk") {
      tx.multiWorkerId = this.transactionForm.value.workerIds as string[];
    } else {
      // payment-group
      const pgId = this.transactionForm.value.paymentGroupId as string;
      const group = this.paymentGroups.find(g => g.id === pgId);
      tx.multiWorkerId = group ? group.workerIds : [];
    }

    try {
      await this.transactionService.createTransaction(tx);
      this.dialogRef.close(true);
    } catch (err) {
      console.error("Create Transaction failed", err);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
