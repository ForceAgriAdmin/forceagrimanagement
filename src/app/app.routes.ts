import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { WorkersComponent } from './pages/workers/workers.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { WorkerslistComponent } from './pages/workers/workerslist/workerslist.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { WorkerDetailComponent } from './pages/workers/worker-detail/worker-detail.component';
import { TransactionListComponent } from './pages/transactions/transaction-list/transaction-list.component';
import { ManageComponent } from './pages/management/manage/manage.component';
import { UserManagementComponent } from './pages/management/manage/user-management/user-management.component';
import { WorkerManagementComponent } from './pages/management/manage/worker-management/worker-management.component';
import { TransactionManagementComponent } from './pages/management/manage/transaction-management/transaction-management.component';
import { PaymentgroupManagementComponent } from './pages/management/manage/paymentgroup-management/paymentgroup-management.component';
import { ReportManagementComponent } from './pages/management/manage/report-management/report-management.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'workers',
    component: WorkersComponent,
    children: [
      { path: 'list', component: WorkerslistComponent },
      { path: 'list/edit/:id', component: WorkerDetailComponent },
    ],
  },
  {
    path: 'transactions',
    component: TransactionsComponent,
    children: [
      { path: 'list', component: TransactionListComponent },
    ]
  },
  {
    path: 'manage',
    component: ManageComponent,
    children: [
      { path: 'users', component: UserManagementComponent },
      { path: 'workers', component: WorkerManagementComponent },
      { path: 'transactions', component: TransactionManagementComponent },
      { path: 'payment-groups', component: PaymentgroupManagementComponent },
      { path: 'reports', component: ReportManagementComponent },

    ],
  }
];
