import { Component, } from '@angular/core';
import { MenuItem } from '../../models/layout/menuitem';
import { MenucardComponent } from '../../components/layout/menucard/menucard.component';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MessageModule } from '@syncfusion/ej2-angular-notifications'
@Component({
  selector: 'app-workers',
  imports: [ 
    CommonModule,
    MenucardComponent,
    RouterOutlet,
    RouterModule,
    MessageModule
  ],
  templateUrl: './workers.component.html',
  styleUrl: './workers.component.scss'
})
export class WorkersComponent {
  childActive: boolean = false;

  cards: MenuItem[] = [
    { icon: 'list', label: 'List', route: '/workers/list' },
    { icon: 'person_add', label: 'Add New', route: '/workers/add' },
    { icon: 'summarize', label: 'Reports', route: '/workers/reports' }
  ];

  onActivate(child: any): void {
    this.childActive = true;
  }

  onDeactivate(child: any): void {
    this.childActive = false;
  }
}
