import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from '../../../models/layout/menuitem';
import { Router } from '@angular/router';
import {MatCardModule} from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon';
import { HasRoleDirective } from '../../../directives/has-role.directive';
@Component({
  selector: 'app-menucard',
  imports: [
    MatCardModule,
    MatIconModule,
    HasRoleDirective
  ],
  templateUrl: './menucard.component.html',
  styleUrl: './menucard.component.scss'
})
export class MenucardComponent {
  @Input() data!: MenuItem;
  @Input() roles!: string[];
   @Output() cardClicked = new EventEmitter<MenuItem>();

   

  constructor(private router: Router) {}

  onCardClick() {
    if(this.data.route != '/')
    {
      this.router.navigate([this.data.route]);
    }
     this.cardClicked.emit(this.data);
  }
}
