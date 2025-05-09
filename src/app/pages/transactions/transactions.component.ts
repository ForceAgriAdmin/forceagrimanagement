import { Component } from '@angular/core';
import { MenuItem } from '../../models/layout/menuitem';
import { CommonModule } from '@angular/common';
import { MenucardComponent } from '../../components/layout/menucard/menucard.component';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MessageModule } from '@syncfusion/ej2-angular-notifications';

@Component({
  selector: 'app-transactions',
  imports: [ 
    CommonModule,
    MenucardComponent,
    RouterOutlet,
    RouterModule,
    MessageModule
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent {
 childActive: boolean = false;

  cards: MenuItem[] = [
    { icon: 'list', label: 'List', route: '/transactions/list' },
    { icon: 'payments', label: 'New', route: '/transactions/add' },
    { icon: 'summarize', label: 'Reports', route: '/transactions/reports' }
  ];

  onActivate(child: any): void {
    this.childActive = true;
  }

  onDeactivate(child: any): void {
    this.childActive = false;
  }
}
