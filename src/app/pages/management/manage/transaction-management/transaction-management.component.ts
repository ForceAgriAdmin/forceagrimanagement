import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MessageModule } from '@syncfusion/ej2-angular-notifications';
import { ForceSearchComponent } from '../../../../components/general/force-search/force-search.component';
import { ForceButtonComponent } from '../../../../components/general/forcebutton/forcebutton.component';
import { ConfirmDeleteComponent } from '../../../../dialogs/confirm-delete/confirm-delete.component';
import { TransactionsService } from '../../../../services/transactions.service';
import { AddTransactionTypeComponent, TransactionTypeDialogData } from '../../../../dialogs/add-transaction-type/add-transaction-type.component';
import { NotificationListComponent } from '../../../../components/general/notification-message/notification-message.component';
import { NotificationService } from '../../../../services/notification.service';

interface TransactionTypeView {
  id: string;
  name: string;
  description: string;
  isCredit: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-transaction-management',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MessageModule,
    ForceSearchComponent,
    ForceButtonComponent
  ],
  templateUrl: './transaction-management.component.html',
  styleUrl: './transaction-management.component.scss'
})
export class TransactionManagementComponent  implements OnInit
{
  notifications: { id: string; severity: string; message: string }[] = [];

  displayedColumns = [
    'name',
    'description',
    'isCredit',
    'createdAt',
    'actions'
  ];
  dataSource = new MatTableDataSource<TransactionTypeView>([]);
  loading = true;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ts: TransactionsService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    // filter by name/description
    this.dataSource.filterPredicate = (
      row: TransactionTypeView,
      filter: string
    ) =>
      [row.name, row.description]
        .join(' ')
        .toLowerCase()
        .includes(filter);

    this.ts.getTransactionTypes().subscribe(types => {
      const view = types.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        isCredit: t.isCredit,
        createdAt: (t.createdAt as any)?.toDate() ?? new Date()
      }));
      this.dataSource.data = view;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.loading = false;
    });
  }

  filter(term: string) {
    this.dataSource.filter = term.trim().toLowerCase();
  }
  clearSearch() {
    this.dataSource.filter = '';
  }

  onAdd() {
    const ref = this.dialog.open(
      AddTransactionTypeComponent,
      {
        width: '450px',
        data: null
      }
    );
    ref.afterClosed().subscribe(
      (res: TransactionTypeDialogData) => {
        if (!res) return;
         this.notify.showSuccess('Transaction type added');
      }
    );
  }

  onEdit(row: TransactionTypeView) {
    const ref = this.dialog.open(
      AddTransactionTypeComponent,
      {
        width: '450px',
        data: {
          id: row.id,
          name: row.name,
          description: row.description,
          isCredit: row.isCredit
        } as TransactionTypeDialogData
      }
    );
    ref.afterClosed().subscribe(
      (res: TransactionTypeDialogData) => {
        if (!res) return;
        this.notify.showSuccess('Transaction type updated');
      }
    );
  }

  onDelete(row: TransactionTypeView) {
    const ref = this.dialog.open(
      ConfirmDeleteComponent,
      {
        width: '400px',
        data: { name: row.name }
      }
    );
    ref.afterClosed().subscribe(yes => {
      if (!yes) return;
      this.ts.deleteTransactionType(row.id).subscribe(() => {
        this.notify.showError('Transaction type deleted');
      });
    });
  }
}
