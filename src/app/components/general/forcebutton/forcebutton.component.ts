import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-force-button',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './forcebutton.component.html',
  styleUrls: ['./forcebutton.component.scss']
})
export class ForceButtonComponent {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Output() action = new EventEmitter<void>();

  onClick(): void {
    this.action.emit();
  }
}
