import { Component } from '@angular/core';
import { MenuItem } from '../../../models/layout/menuitem';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MessageModule } from '@syncfusion/ej2-angular-notifications';
import { MenucardComponent } from '../../../components/layout/menucard/menucard.component';

@Component({
  selector: 'app-manage',
  imports: [
    CommonModule,
    MenucardComponent,
    RouterOutlet,
    RouterModule,
    MessageModule],
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.scss'
})
export class ManageComponent {
childActive: boolean = false;

  cards: MenuItem[] = [
    { icon: 'people_add', label: 'Users', route: '/manage/users',eventIdentifier:'' },
    { icon: 'apartment', label: 'Operations', route: '/manage/operations',eventIdentifier:''  },
    { icon: 'people', label: 'Worker Types', route: '/manage/workers' ,eventIdentifier:'' },
    { icon: 'payments', label: 'Transaction Types', route: '/manage/transactions',eventIdentifier:''  },
    { icon: 'people_group', label: 'Payment Groups', route: '/manage/payment-groups',eventIdentifier:''  },
    { icon: 'summarize', label: 'Reports', route: '/manage/reports',eventIdentifier:''  }
    

  ];

  onActivate(child: any): void {
    this.childActive = true;
  }

  onDeactivate(child: any): void {
    this.childActive = false;
  }
}
