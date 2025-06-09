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
    MatListModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ForceAgri Management';
  menuItems: MenuItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: 'dashboard',eventIdentifier:''  },
    { icon: 'person', label: 'Workers', route: 'workers' ,eventIdentifier:'' },
    { icon: 'money', label: 'Transaction', route: 'transactions',eventIdentifier:''  },
    {icon :'settings',label:'Manage',route: 'manage',eventIdentifier:'' }
  ];
  user$: Observable<any>;

   loggedInUser: AppUser = {
        uid: '',
        email: '',
        displayName: '',
        createdAt: Timestamp.now(),
        farmId: '',
        roles: []
      };
  constructor(private authService: AuthService, private router: Router) {
    this.user$ = this.authService.authState$;
  }
  ngOnInit(): void {
    this.authService.authState$.subscribe(user => {

      if (!user) {
        this.router.navigate(['/login']);
      }

      this.loggedInUser.email = user?.email || '';
      this.loggedInUser.uid = user?.uid || '';

    });
     registerLicense('Ngo9BigBOggjHTQxAR8/V1NNaF5cXmBCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXtcc3RWRWNYVUBxV0pWYUA=');
  }
}
