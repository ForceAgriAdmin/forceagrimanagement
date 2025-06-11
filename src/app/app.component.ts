import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { MenuItem } from './models/layout/menuitem';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AppUser } from './models/users/user.model';
import { Timestamp } from '@angular/fire/firestore';
 import { registerLicense } from '@syncfusion/ej2-base';
import { HasRoleDirective } from './directives/has-role.directive';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConfirmDeleteComponent } from './dialogs/confirm-delete/confirm-delete.component';
import { MatDialog } from '@angular/material/dialog';
import { YesNoComponent } from './dialogs/yes-no/yes-no.component';
@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    AngularFireModule,
    AngularFirestoreModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    HasRoleDirective,
    MatProgressSpinnerModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ForceAgri Management';
  menuItems: MenuItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: 'dashboard',eventIdentifier:'',roles: ['SuperAdmin','Admin','Manager','User']},
    { icon: 'person', label: 'Workers', route: 'workers' ,eventIdentifier:'',roles: ['SuperAdmin','Admin','Manager','User'] },
    { icon: 'money', label: 'Transaction', route: 'transactions',eventIdentifier:'',roles: ['SuperAdmin','Admin','Manager','User']},
    {icon :'settings',label:'Manage',route: 'manage',eventIdentifier:'',roles: ['SuperAdmin','Admin']  }
  ];
  user$: Observable<any>;

isLoggedIn: boolean = false;
   loggedInUser: AppUser = {
        uid: '',
        email: '',
        displayName: '',
        createdAt: Timestamp.now(),
        farmId: '',
        roles: []
      };
  constructor(private authService: AuthService, private router: Router,private dialog: MatDialog) {
    this.user$ = this.authService.authState$;
  }
  ngOnInit(): void {
    this.isLoggedIn = false;
    this.authService.authState$.subscribe(user => {

      if (!user) {
        this.isLoggedIn = false;
        this.router.navigate(['/login']);
      }

      this.isLoggedIn = true;
      this.loggedInUser.email = user?.email || '';
      this.loggedInUser.uid = user?.uid || '';

    });
     registerLicense('Ngo9BigBOggjHTQxAR8/V1NNaF5cXmBCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXtcc3RWRWNYVUBxV0pWYUA=');
  }

  onLogout() {
const dlg = this.dialog.open(
      YesNoComponent,
      {
        width: '400px',
        data: {
          title: 'Logout',
          message: 'Are you sure you want to logout.'
        }
      }
    );
    dlg.afterClosed().subscribe(yes => {
      if (!yes) return;

      this.authService.logout();
    });
  }
}
