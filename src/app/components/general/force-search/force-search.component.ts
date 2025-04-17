import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-force-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './force-search.component.html',
  styleUrls: ['./force-search.component.scss']
})
export class ForceSearchComponent {
  @Input() label: string = 'Search';
  @Input() placeholder: string = 'Search...';
  @Output() searchChange = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  searchTerm: string = '';

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  onCancelSearch(): void {
    this.searchTerm = '';
    this.searchChange.emit(this.searchTerm);
    this.cancel.emit();
  }
}
