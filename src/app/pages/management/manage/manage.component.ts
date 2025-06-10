import { Component } from '@angular/core';
import { MenuItem } from '../../../models/layout/menuitem';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MessageModule } from '@syncfusion/ej2-angular-notifications';
import { MenucardComponent } from '../../../components/layout/menucard/menucard.component';
import { HasRoleDirective } from '../../../directives/has-role.directive';

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
    { icon: 'people_add', label: 'Users', route: '/manage/users',eventIdentifier:'',roles: ['SuperAdmin','Admin'] },
    { icon: 'apartment', label: 'Operations', route: '/manage/operations',eventIdentifier:'',roles: ['SuperAdmin','Admin']     },
    { icon: 'people', label: 'Worker Types', route: '/manage/workers' ,eventIdentifier:'',roles: ['SuperAdmin','Admin']  },
    { icon: 'payments', label: 'Transaction Types', route: '/manage/transactions',eventIdentifier:'',roles: ['SuperAdmin','Admin']    },
    { icon: 'people_group', label: 'Payment Groups', route: '/manage/payment-groups',eventIdentifier:'',roles: ['SuperAdmin','Admin']    },
    { icon: 'summarize', label: 'Reports', route: '/manage/reports',eventIdentifier:'',roles: ['SuperAdmin','Admin']    }
    

  ];

  onActivate(child: any): void {
    this.childActive = true;
  }

  onDeactivate(child: any): void {
    this.childActive = false;
  }
}
