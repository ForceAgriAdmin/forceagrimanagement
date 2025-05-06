import { Component, Inject, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Timestamp } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { Router, RouterModule } from "@angular/router";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";

import { TransactionsService } from "../../services/transactions.service";
import { AuthService } from "../../services/auth.service";
import { WorkersService } from "../../services/workerservice.service";

import { TransactionModel } from "../../models/transactions/transaction";
import { TransactionTypeModel } from "../../models/transactions/transactiontype";
import { WorkerModel } from "../../models/workers/worker";
import { UserProfile } from "../../models/users/user.model";
import {
  AddWorkerTransactionComponent,
  AddWorkerTransactionDialogData,
} from "../add-worker-transaction/add-worker-transaction.component";

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
  loggedInUser: UserProfile = { uid: "", email: "", displayName: "" };

  constructor(
    public dialogRef: MatDialogRef<AddWorkerTransactionComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: AddWorkerTransactionDialogData,
    private fb: FormBuilder,
    private transactionService: TransactionsService,
    private authService: AuthService,
    private router: Router,
    private workersService: WorkersService
  ) {
    // Note: using control name `function` to match your model
    this.transactionForm = this.fb.group({
      function: ["single", Validators.required],
      operationId: ["", Validators.required],
      workerIds: [[], Validators.required],            // will hold either [one] or [many]
      transactionTypeId: ["", Validators.required],
      description: ["", Validators.required],
      amount: ["", [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit(): void {
    // redirect if not logged in
    this.authService.authState$.subscribe((user) => {
      if (!user) {
        this.router.navigate(["/login"]);
      } else {
        this.loggedInUser = {
          uid: user.uid,
          email: user.email ?? "",
          displayName: user.displayName ?? "",
        };
      }
    });

    // load dropdown data
    this.transactionService
      .getTransactionTypes()
      .subscribe((types) => (this.transactionTypes = types));

    this.workersService
      .getWorkers()
      .subscribe((list) => (this.workers = list));

    // when `function` changes, adjust validation on workerIds
    this.transactionForm
      .get("function")!
      .valueChanges.subscribe((fn) => {
        const w = this.transactionForm.get("workerIds")!;
        if (fn === "payment-group") {
          w.clearValidators();
          w.setValue([]);
        } else {
          w.setValidators([Validators.required]);
        }
        w.updateValueAndValidity();
      });
  }

  async onSubmit(): Promise<void> {
    if (this.transactionForm.invalid) {
      return;
    }

    const fn = this.transactionForm.value.function as "single" | "bulk" | "payment-group";
    // base transaction fields
    const baseTx: Omit<TransactionModel, "workerId" | "multiWorkerId"> = {
      timestamp:        Timestamp.now(),
      amount:           Number(this.transactionForm.value.amount),
      description:      this.transactionForm.value.description,
      transactionTypeId:this.transactionForm.value.transactionTypeId,
      creatorId:        this.loggedInUser.uid,
      operationId:      this.transactionForm.value.operationId,
      function:         fn,
    };

    // build the final payload
    const tx: TransactionModel = {
      ...baseTx,
      workerId: "",              // set below for single
      multiWorkerId: [],         // set below for bulk
    };

    if (fn === "single") {
      // expect exactly one selection in the array
      const arr = this.transactionForm.value.workerIds as string[];
      tx.workerId = arr[0];
      tx.multiWorkerId = [];
    } else if (fn === "bulk") {
      tx.multiWorkerId = this.transactionForm.value.workerIds as string[];
      tx.workerId = "";
    } else {
      // payment-group
      tx.workerId = "";
      tx.multiWorkerId = [];
    }

    try {
      await this.transactionService.createTransaction(tx);
      this.dialogRef.close();
    } catch (err) {
      console.error("Create Transaction failed", err);
      // TODO: show user-friendly error
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
