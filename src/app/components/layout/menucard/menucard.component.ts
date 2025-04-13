import { Component, Input } from '@angular/core';
import { MenuItem } from '../../../models/layout/menuitem';
import { Router } from '@angular/router';
import {MatCardModule} from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-menucard',
  imports: [
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './menucard.component.html',
  styleUrl: './menucard.component.scss'
})
export class MenucardComponent {
  @Input() data!: MenuItem;

  constructor(private router: Router) {}

  onCardClick() {
    this.router.navigate([this.data.route]);
  }
}
