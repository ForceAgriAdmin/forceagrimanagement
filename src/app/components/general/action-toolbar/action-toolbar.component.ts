import { Component, EventEmitter, Input, Output  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActionButton } from '../../../models/layout/actionbutton';
import { MatCardModule } from '@angular/material/card';
@Component({
  selector: 'app-action-toolbar',
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule,MatCardModule],
  templateUrl: './action-toolbar.component.html',
  styleUrl: './action-toolbar.component.scss'
})
export class ActionToolbarComponent {
  @Input() buttons: ActionButton[] = [];
  @Output() action = new EventEmitter<string>();

  onClick(id: string) {
    this.action.emit(id);
  }
}
