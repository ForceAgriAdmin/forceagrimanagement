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
import { TransactionTypeModel } from '../../models/transactions/transactiontype';
import { TransactionsService } from '../../services/transactions.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { AppUser } from '../../models/users/user.model';
import { Router, RouterModule } from '@angular/router';
import { TransactionModel } from '../../models/transactions/transaction';
import { Timestamp } from '@angular/fire/firestore';
export interface AddWorkerTransactionDialogData {
  worker?: WorkerModel | null;
}

@Component({
  selector: 'app-add-worker-transaction',
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
  templateUrl: './add-worker-transaction.component.html',
  styleUrl: './add-worker-transaction.component.scss',
})
export class AddWorkerTransactionComponent {
  @Input() worker!: WorkerModel;
  transactionForm: FormGroup;
  transactionTypes: TransactionTypeModel[] =[];
  transaction: TransactionModel = {
    timestamp: Timestamp.now(),       
    amount: 0,                        
    description: '',                  
    operationId: '',   
    creatorId: '',        
    transactionTypeId: '',   
    workerId: '',
    function: 'single' ,
    multiWorkerId: []          
  };
  user$: Observable<any>;
  
    loggedInUser: AppUser = {
      uid: '',
      email: '',
      displayName: '',
      createdAt: Timestamp.now(),
      roles: []
    };
  constructor(
    public dialogRef: MatDialogRef<AddWorkerTransactionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddWorkerTransactionDialogData,
    private fb: FormBuilder,
    private transactionService: TransactionsService,
    private authService: AuthService,
    private router: Router
  ) {
    this.transactionForm = this.fb.group({
      description: ['', Validators.required],
      amount: ['', Validators.required],
      transactionTypeId: ['', Validators.required],
    });
    this.user$ = this.authService.authState$;
  }

  
  ngOnInit(): void {
    this.authService.authState$.subscribe(user => {

      if (!user) {
        this.router.navigate(['/login']);
      }

      this.loggedInUser.email = user?.email || '';
      this.loggedInUser.uid = user?.uid || '';

    });
    if (this.data.worker) {
      this.worker = this.data.worker;
    } else {
      throw new Error('AddWorkerTransactionComponent requires a worker');
    }

    this.transactionService.getTransactionTypes()
      .subscribe(types => (this.transactionTypes = types));
  }

  onSubmit(): void {

    if(this.transactionForm.valid){
      this.transaction.amount = Number(this.transactionForm.value.amount)
      this.transaction.description = this.transactionForm.value.description
      this.transaction.transactionTypeId = this.transactionForm.value.transactionTypeId,
      this.transaction.creatorId = this.loggedInUser.uid
      this.transaction.timestamp = Timestamp.now()
      this.transaction.operationId = this.worker.operationId,
      this.transaction.workerId = this.worker.id

      this.transactionService.createTransaction(this.transaction).then(url => {
        //TODO: Create notification alert
        this.dialogRef.close();
      })
      .catch(error => {
        console.error('Create Transaction failed', error);
        // Optionally notify the user of the failure.
      });
      }
      
    

      
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
