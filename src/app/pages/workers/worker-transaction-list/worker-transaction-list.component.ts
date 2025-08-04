// src/app/pages/worker-transaction-list/worker-transaction-list.component.ts

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Subscription } from 'rxjs';
import { TransactionModel } from '../../../models/transactions/transaction';
import { TransactionTypeModel } from '../../../models/transactions/transactiontype';
import { TransactionsService } from '../../../services/transactions.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './worker-transaction-list.component.html',
  styleUrls: ['./worker-transaction-list.component.scss']
})
export class TransactionListComponent implements OnChanges, OnDestroy {
  @Input() workerId!: string;
  @Output() edit = new EventEmitter<TransactionModel>();

  transactions: TransactionModel[] = [];
  transactionTypes: TransactionTypeModel[] = [];

  private sub!: Subscription;
  private typeSub!: Subscription;

  constructor(
    private transactionService: TransactionsService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['workerId'] && this.workerId) {
      if (this.sub) this.sub.unsubscribe();
      if (this.typeSub) this.typeSub.unsubscribe();

      this.sub = this.transactionService
        .getTransactionsByWorkerId(this.workerId)
        .subscribe((t: TransactionModel[]) => {
          this.transactions = t.sort((a, b) =>
            b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime()
          );
        });

      this.typeSub = this.transactionService
        .getTransactionTypes()
        .subscribe((types: TransactionTypeModel[]) => {
          this.transactionTypes = types;
        });
    }
  }

  getTypeName(transactionTypeId: string): string {
    return (
      this.transactionTypes.find(t => t.id === transactionTypeId)?.name || '—'
    );
  }

  onEdit(tx: TransactionModel) {
    this.edit.emit(tx);
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.typeSub) this.typeSub.unsubscribe();
  }
}
