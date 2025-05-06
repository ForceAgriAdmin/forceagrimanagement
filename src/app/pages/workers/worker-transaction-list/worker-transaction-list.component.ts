import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { TransactionModel } from '../../../models/transactions/transaction';
import { TransactionsService } from '../../../services/transactions.service';

@Component({
  selector: 'app-transaction-list',
  imports: [CommonModule, MatCardModule, MatListModule,MatIconModule],
  templateUrl: './worker-transaction-list.component.html',
  styleUrl: './worker-transaction-list.component.scss'
})
export class TransactionListComponent implements OnInit{
  @Input() workerId!: string;
  @Output() edit = new EventEmitter<TransactionModel>();
  
  transactions: TransactionModel[] = [];

  constructor(private transactionService: TransactionsService){}

  ngOnInit(): void {
    this.transactionService.getTransactionsByWorkerId(this.workerId).subscribe((t: TransactionModel[]) => {
         this.transactions = t;
        });
  }

  onEdit(tx: TransactionModel) {
    this.edit.emit(tx);
  }
}
