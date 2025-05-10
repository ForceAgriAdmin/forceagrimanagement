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
import { WorkerModel } from '../../../../models/workers/worker';
import { PaymentGroupService } from '../../../../services/payment-group.service';
import { WorkersService } from '../../../../services/workerservice.service';
import { AddPaymentGroupComponent, PaymentGroupDialogData } from '../../../../dialogs/add-payment-group/add-payment-group.component';
import { ConfirmDeleteComponent } from '../../../../dialogs/confirm-delete/confirm-delete.component';

interface PaymentGroupView {
  id: string;
  description: string;
  workerNames: string;
  workerIds: string[];
  createdAt: Date;
}


@Component({
  selector: 'app-paymentgroup-management',
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
  templateUrl: './paymentgroup-management.component.html',
  styleUrl: './paymentgroup-management.component.scss'
})
export class PaymentgroupManagementComponent implements OnInit {
  notifications: {
    id: string;
    severity: string;
    message: string;
  }[] = [];

  displayedColumns = [
    'description',
    'workerNames',
    'createdAt',
    'actions'
  ];
  dataSource =
    new MatTableDataSource<PaymentGroupView>([]);
  loading = true;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private allWorkers: WorkerModel[] = [];

  constructor(
    private pgService: PaymentGroupService,
    private ws: WorkersService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // load workers + groups together
    this.ws.getWorkers().subscribe(workers => {
      this.allWorkers = workers;

      this.pgService.getGroups().subscribe(groups => {
        const view = groups.map(g => {
          // map workerIds → names
          const names = g.workerIds
            .map(id => {
              const w = workers.find(x => x.id === id);
              return w
                ? `${w.firstName} ${w.lastName}`
                : '?';
            })
            .join(', ');
          return {
            id: g.id,
            description: g.description,
            workerNames: names,
            workerIds: g.workerIds,
            createdAt:
              (g.createdAt as any)?.toDate() ??
              new Date()
          } as PaymentGroupView;
        });
        this.dataSource.data = view;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.loading = false;
      });
    });

    // filter logic
    this.dataSource.filterPredicate = (
      row: PaymentGroupView,
      filter: string
    ) =>
      (
        row.description +
        ' ' +
        row.workerNames
      )
        .toLowerCase()
        .includes(filter);
  }

  filter(term: string) {
    this.dataSource.filter =
      term.trim().toLowerCase();
  }
  clearSearch() {
    this.dataSource.filter = '';
  }

  // onAdd() {
  //   const ref = this.dialog.open(
  //     AddPaymentGroupComponent,
  //     {
  //       width: '500px',
  //       data: null
  //     }
  //   );
  //   ref.afterClosed().subscribe((res) => {
  //     if (!res) return;
  //     // prepend new group
  //     const names = res.workerIds
  //       .map((id: string) => {
  //         const w = this.allWorkers.find(x => x.id === id);
  //         return w
  //           ? `${w.firstName} ${w.lastName}`
  //           : '?';
  //       })
  //       .join(', ');
  //     this.dataSource.data = [
  //       {
  //         id: res.id,
  //         description: res.description,
  //         workerNames: names,
  //         workerIds: res.workerIds,
  //         createdAt: new Date()
  //       },
  //       ...this.dataSource.data
  //     ];
  //     this.notifications.push({
  //       id: 'add_pg',
  //       severity: 'Success',
  //       message: 'Payment Group Created'
  //     });
  //   });
  // }
onAdd() {
  const ref = this.dialog.open(AddPaymentGroupComponent, { width: '500px', data: null });
  ref.afterClosed().subscribe(res => {
    if (!res) return;
    // don't manually update dataSource—firestore subscription will
    this.notifications.push({
      id: 'add_pg',
      severity: 'Success',
      message: 'Payment Group Created'
    });
  });
}
  onEdit(row: PaymentGroupView) {
    const dlg = this.dialog.open(
      AddPaymentGroupComponent,
      {
        width: '500px',
        data: {
          id: row.id,
          description: row.description,
          workerIds: row.workerIds
        } as PaymentGroupDialogData
      }
    );
    dlg.afterClosed().subscribe(res => {
      if (!res) return;
      // update row in place
      this.dataSource.data = this.dataSource.data.map(
        r =>
          r.id === res.id
            ? {
                ...r,
                description: res.description,
                workerIds: res.workerIds,
                workerNames: res.workerIds
                  .map((id: string) => {
                    const w = this.allWorkers.find(
                      x => x.id === id
                    );
                    return w
                      ? `${w.firstName} ${w.lastName}`
                      : '?';
                  })
                  .join(', ')
              }
            : r
      );
      this.notifications.push({
        id: 'edit_pg',
        severity: 'Success',
        message: 'Payment Group Updated'
      });
    });
  }

  onDelete(row: PaymentGroupView) {
    const dlg = this.dialog.open(
      ConfirmDeleteComponent,
      {
        width: '400px',
        data: {
          name: row.description
        }
      }
    );
    dlg.afterClosed().subscribe(yes => {
      if (!yes) return;
      this.pgService
        .deleteGroup(row.id)
        .subscribe(() => {
          this.dataSource.data =
            this.dataSource.data.filter(
              r => r.id !== row.id
            );
          this.notifications.push({
            id: 'del_pg',
            severity: 'Success',
            message: 'Payment Group Deleted'
          });
        });
    });
  }

}
