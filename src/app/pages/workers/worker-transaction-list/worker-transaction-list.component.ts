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
  private sub!: Subscription;

  constructor(private transactionService: TransactionsService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['workerId'] && this.workerId) {
      // If there's an existing subscription, unsubscribe before re-subscribing
      if (this.sub) {
        this.sub.unsubscribe();
      }

      // Firestore array‐contains query on the new `workerIds` field
      this.sub = this.transactionService
        .getTransactionsByWorkerId(this.workerId)
        .subscribe((t: TransactionModel[]) => {
          // Sort by timestamp descending, if you like:
          this.transactions = t.sort((a, b) =>
            b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime()
          );
        });
    }
  }

  onEdit(tx: TransactionModel) {
    this.edit.emit(tx);
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
