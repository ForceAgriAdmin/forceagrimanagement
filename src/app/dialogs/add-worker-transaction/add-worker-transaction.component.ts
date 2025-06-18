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
import { NotificationService } from '../../services/notification.service';
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
    id: '',
    timestamp: Timestamp.now(),       
    amount: 0,                        
    description: '',
    creatorId: '',        
    transactionTypeId: '', 
    farmId: '',  
    workerTypesIds: [],
    function: 'single',
    operationIds: [], 
    workerIds: [] ,         
    paymentGroupIds: [],
    isSettleTransaction: false
  };
  user$: Observable<any>;
  
    loggedInUser: AppUser = {
        uid: '',
        email: '',
        displayName: '',
        createdAt: Timestamp.now(),
        farmId: '',
        roles: []
      };
  constructor(
    public dialogRef: MatDialogRef<AddWorkerTransactionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddWorkerTransactionDialogData,
    private fb: FormBuilder,
    private transactionService: TransactionsService,
    private authService: AuthService,
    private router: Router,
    private notify: NotificationService
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

      this.transaction.operationIds.push(this.worker.operationId)
      this.transaction.workerIds.push(this.worker.id)

      this.transactionService.createTransaction(this.transaction).then(async url => {
        
        const tranTypeName = this.transactionTypes.find(x => x.id === this.transaction.transactionTypeId)?.name;

        this.transaction.id = url;
         if (tranTypeName && tranTypeName.toLowerCase() === 'shop') {
          await this.transactionService.PrintTransactionSlip(this.transaction);
        }
        this.dialogRef.close();
      })
      .catch(error => {
        this.notify.showError(`Failed to create transaction: ${error}`)
      });
      }
      
    

      
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
