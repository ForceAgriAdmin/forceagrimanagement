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
import { UserProfile } from './models/users/statemanagement/user.model';
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
    { icon: 'dashboard', label: 'Dashboard', route: 'dashboard' },
    { icon: 'person', label: 'Workers', route: 'workers' },
    { icon: 'money', label: 'Transaction', route: 'transactions' }
  ];
  user$: Observable<any>;

  loggedInUser: UserProfile = {
    uid: '',
    email: '',
    displayName: ''
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
  }
}
