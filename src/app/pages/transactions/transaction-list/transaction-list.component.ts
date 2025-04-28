import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { TransactionModel } from '../../../models/transactions/transaction';

@Component({
  selector: 'app-transaction-list',
  imports: [CommonModule, MatCardModule, MatListModule,MatIconModule],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss'
})
export class TransactionListComponent {
  @Input() workerId!: string;
  @Output() edit = new EventEmitter<TransactionModel>();
  // dummy data until real backend hooked
  transactions: TransactionModel[] = [
    { timestamp: new Date(), amount: 100, description: 'Initial balance',operation:'Irrigation' },
    { timestamp: new Date(), amount: -20, description: 'Purchase supplies' ,operation:'Irrigation' },
    { timestamp: new Date(), amount: 50, description: 'Bonus payment' ,operation:'Irrigation' }
  ];

  onEdit(tx: TransactionModel) {
    this.edit.emit(tx);
  }
}
