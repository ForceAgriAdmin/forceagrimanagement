import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { WorkersComponent } from './pages/workers/workers.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { WorkerslistComponent } from './pages/workers/workerslist/workerslist.component';
import { LoginComponent } from './pages/auth/login/login.component';

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
    children: [{ path: 'list', component: WorkerslistComponent }],
  },
  {
    path: 'transactions',
    component: TransactionsComponent,
  },
];
