import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { WorkerModel } from '../../../models/workers/worker';

export interface LookupItem {
  id: string | number;
  name: string;
}

@Component({
  selector: 'app-worker-details-card',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './worker-details-card.component.html',
  styleUrls: ['./worker-details-card.component.scss']
})
export class WorkerDetailsCardComponent {
  @Input() worker!: WorkerModel; 
  @Input() form!: FormGroup;
  @Input() operations: LookupItem[] = [];
  @Input() farms: LookupItem[] = [];
}
