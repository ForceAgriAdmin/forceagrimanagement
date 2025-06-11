import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MessageModule } from '@syncfusion/ej2-angular-notifications';
import { ForceSearchComponent } from '../../../../components/general/force-search/force-search.component';
import { ForceButtonComponent } from '../../../../components/general/forcebutton/forcebutton.component';
import { AuthService } from '../../../../services/auth.service';
import { AppUser } from '../../../../models/users/user.model';
import { DialogData, UserComponent } from '../../../../dialogs/user/user.component';
import { ConfirmDeleteComponent } from '../../../../dialogs/confirm-delete/confirm-delete.component';
import { HasRoleDirective } from '../../../../directives/has-role.directive';
import { NotificationService } from '../../../../services/notification.service';
@Component({
  selector: 'app-user-management',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MessageModule,
    ForceSearchComponent,
    ForceButtonComponent,
    HasRoleDirective
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent {
  displayedColumns = [
    'email',
    'displayName',
    'roles',
    'createdAt',
    'actions'
  ];
  dataSource = new MatTableDataSource<AppUser>([]);
  loading = true;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit() {
//     this.authService.currentUserRoles$.subscribe(roles =>
//   console.log('🔥 currentUserRoles$ =', roles)
// );
    // same pattern as your Transactions filter
    this.dataSource.filterPredicate = (
      u: AppUser,
      filter: string
    ) => {
      const hay = [u.uid, u.email, u.displayName]
        .join(' ')
        .toLowerCase();
      return hay.includes(filter);
    };

    this.authService.getUsers().subscribe(users => {
      const view = users.map(u => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        farmId: u.farmId ? u.farmId : 'LRXY7Su8v0ga6U8OwxJT',
        createdAt: (u.createdAt as any)?.toDate() ?? new Date(),
        roles: Array.isArray(u.roles) ? u.roles : ['User'],
      }));
      this.dataSource.data    = view;
      this.dataSource.sort    = this.sort;
      this.dataSource.paginator = this.paginator;
      this.loading            = false;
    });
  }

  filterUsers(term: string) {
    this.dataSource.filter = term.trim().toLowerCase();
  }

  clearSearch() {
    this.dataSource.filter = '';
  }

  onAddUser() {
    const ref = this.dialog.open(UserComponent, {
      width: '500px',
      data: null,
      panelClass: 'user-dialog'
    });
    ref.afterClosed().subscribe(result => {
      if (!result) {
        return;    // nothing to do
      }
      if (result) {
        // prepend the new user
        this.dataSource.data = [
          {
            uid: result.uid,
            email: result.email,
            displayName: result.displayName,
            createdAt: result.createdAt,
            farmId: result.farmId,
            roles: result.roles
          },
          ...this.dataSource.data
        ];
        this.notify.showSuccess('User added successfully');
      }
    });
  }

  onEditUser(row: AppUser) {
    const ref = this.dialog.open(UserComponent, {
      width: '500px',
      data: {
        uid: row.uid,
        email: row.email,
        displayName: row.displayName,
        roles: row.roles
      }
    });
    ref.afterClosed().subscribe((result: DialogData & { roles: string[] }) => {
      if (!result) return;
      this.dataSource.data = this.dataSource.data.map(u =>
        u.uid === result.uid
          ? {
              ...u,
              email: result.email!,
              displayName: result.displayName!,
              roles: result.roles
            }
          : u
      );
      this.notify.showSuccess('User updated successfully');
    });
  }

  onDeleteUser(row: AppUser) {
    const ref = this.dialog.open(ConfirmDeleteComponent, {
      width: '400px',
      data: { name: row.displayName || row.email }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.authService.deleteUser(row.uid).subscribe(() => {
          this.dataSource.data = this.dataSource.data.filter(
            u => u.uid !== row.uid
          );
          this.notify.showSuccess('User deleted successfully');
        });
      }
    });
  }
}
