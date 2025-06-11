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
import { WorkersService } from '../../../../services/workerservice.service';
import { AddWorkerTypeComponent, WorkerTypeDialogData } from '../../../../dialogs/add-worker-type/add-worker-type.component';
import { NotificationService } from '../../../../services/notification.service';


interface WorkerTypeView {
  id: string;
  description: string;
}



@Component({
  selector: 'app-worker-management',
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
  templateUrl: './worker-management.component.html',
  styleUrl: './worker-management.component.scss'
})
export class WorkerManagementComponent implements OnInit
{


  displayedColumns = [
    'description',
    'actions'
  ];
  dataSource =
    new MatTableDataSource<WorkerTypeView>([]);
  loading = true;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ws: WorkersService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    // filter by description
    this.dataSource.filterPredicate = (
      row: WorkerTypeView,
      filter: string
    ) => row.description
      .toLowerCase()
      .includes(filter);

    // load Types
    this.ws.getWorkerTypes().subscribe(types => {
      const view = types.map(t => ({
        id: t.id,
        description: t.description
      }));
      this.dataSource.data = view;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.loading = false;
    });
  }

  filter(term: string) {
    this.dataSource.filter =
      term.trim().toLowerCase();
  }
  clearSearch() {
    this.dataSource.filter = '';
  }

  onAdd() {
    const ref = this.dialog.open(
      AddWorkerTypeComponent,
      {
        width: '400px',
        data: null
      }
    );
    ref.afterClosed().subscribe(
      (res: WorkerTypeDialogData) => {
        if (!res) return;
        this.notify.showSuccess('Worker type added');
      }
    );
  }

  onEdit(row: WorkerTypeView) {
    const ref = this.dialog.open(
      AddWorkerTypeComponent,
      {
        width: '400px',
        data: {
          id: row.id,
          description: row.description
        } as WorkerTypeDialogData
      }
    );
    ref.afterClosed().subscribe(
      (res: WorkerTypeDialogData) => {
        if (!res) return;
        this.notify.showSuccess('Worker type updated');
      }
    );
  }

  onDelete(row: WorkerTypeView) {
    const ref = this.dialog.open(
      ConfirmDeleteComponent,
      {
        width: '400px',
        data: { name: row.description }
      }
    );
    ref.afterClosed().subscribe(yes => {
      if (!yes) return;
      this.ws
        .deleteWorkerType(row.id)
        .subscribe(() => {
          this.notify.showSuccess('Worker type deleted');
        });
    });
  }
}
