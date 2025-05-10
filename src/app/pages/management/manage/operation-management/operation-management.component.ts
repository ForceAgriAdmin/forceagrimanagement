import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule }                from '@angular/common';
import { MatCardModule }               from '@angular/material/card';
import { MatTableModule }              from '@angular/material/table';
import {
  MatPaginatorModule,
  MatPaginator
} from '@angular/material/paginator';
import {
  MatSortModule,
  MatSort
} from '@angular/material/sort';
import { MatIconModule }               from '@angular/material/icon';
import { MatButtonModule }             from '@angular/material/button';
import { MatDialogModule, MatDialog }  from '@angular/material/dialog';
import { MatProgressSpinnerModule }    from '@angular/material/progress-spinner';
import { MatTableDataSource }          from '@angular/material/table';
import { ForceButtonComponent } from '../../../../components/general/forcebutton/forcebutton.component';
import { ForceSearchComponent } from '../../../../components/general/force-search/force-search.component';
import { AddOperationComponent } from '../../../../dialogs/add-operation/add-operation.component';
import { ConfirmDeleteComponent } from '../../../../dialogs/confirm-delete/confirm-delete.component';
import { NotificationMessage } from '../../../../models/layout/notificationmessage';
import { OperationModel } from '../../../../models/operations/operation';
import { OperationService } from '../../../../services/operation.service';

@Component({
  selector: 'app-operation-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ForceSearchComponent,
    ForceButtonComponent
  ],
  templateUrl: './operation-management.component.html',
  styleUrls: ['./operation-management.component.scss']
})
export class OperationManagementComponent implements OnInit {
  notifications: NotificationMessage[] = [];
  displayedColumns = ['name', 'description', 'createdAt', 'updatedAt', 'actions'];
  dataSource = new MatTableDataSource<OperationModel>([]);
  loading = true;

  @ViewChild(MatSort)     sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ops:   OperationService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadOperations();

    // simple text filter on name + description
    this.dataSource.filterPredicate = (row, filter) =>
      (`${row.name} ${row.description}`)
        .toLowerCase()
        .includes(filter);
  }

  private loadOperations() {
    this.loading = true;
    this.ops.getOperations().subscribe(ops => {
      const rows = ops.map(o => {
        // safe conversion: Timestamp → Date, FieldValue or missing → fallback to now
        const toJsDate = (v: any) => {
          if (v && typeof v.toDate === 'function') {
            return v.toDate();
          }
          if (v instanceof Date) {
            return v;
          }
          return new Date();
        };
        return {
          ...o,
          createdAt: toJsDate((o as any).createdAt),
          updatedAt: toJsDate((o as any).updatedAt)
        };
      });
      this.dataSource.data = rows;
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
    const ref = this.dialog.open(AddOperationComponent, {
      width: '400px',
      data: null
    });
    ref.afterClosed().subscribe((created: OperationModel | null) => {
      if (!created) return;
      // reload from server so timestamps have arrived
      this.loadOperations();
      this.notifications.push({
        id: 'add_op',
        severity: 'Success',
        message: 'Operation added'
      });
    });
  }

  onEdit(row: OperationModel) {
    const dlg = this.dialog.open(AddOperationComponent, {
      width: '400px',
      data: row
    });
    dlg.afterClosed().subscribe((updated: OperationModel | null) => {
      if (!updated) return;
      this.loadOperations();
      this.notifications.push({
        id: 'edit_op',
        severity: 'Success',
        message: 'Operation updated'
      });
    });
  }

  onDelete(row: OperationModel) {
    const dlg = this.dialog.open(ConfirmDeleteComponent, {
      width: '350px',
      data: { name: row.name }
    });
    dlg.afterClosed().subscribe(yes => {
      if (!yes) return;
      this.ops.deleteOperation(row.id).then(() => {
        this.loadOperations();
        this.notifications.push({
          id: 'del_op',
          severity: 'Success',
          message: 'Operation deleted'
        });
      });
    });
  }
}
