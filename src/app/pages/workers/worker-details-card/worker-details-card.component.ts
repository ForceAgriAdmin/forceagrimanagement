import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { WorkerModel } from '../../../models/workers/worker';
import { WorkerTypeModel } from '../../../models/workers/worker-type';
import { WorkersService } from '../../../services/workerservice.service';
import { NotificationService } from '../../../services/notification.service';

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
  @Input() workerTypes: WorkerTypeModel[] =[]; 
  @Input() form!: FormGroup;
  @Input() operations: LookupItem[] = [];
  @Input() farms: LookupItem[] = [];

 constructor(private workerService: WorkersService, private notify: NotificationService) {}

    getWorkerActiveStatus(): 'Active' | 'In-Active' {
    return this.worker.isActive ? 'Active' : 'In-Active';
  }


  async toggleStatus(): Promise<void> {
    const newStatus = !this.worker.isActive;
    this.worker.isActive = newStatus;

    try {
      await this.workerService.updateWorker({
        id: this.worker.id,
        isActive: newStatus
      });
      this.notify.showSuccess('Worker Status updated successfully');

    } catch (err) {
      
      this.notify.showError('Failed to update worker status');
      console.error('Failed to update worker status', err);
      // Roll back
      this.worker.isActive = !newStatus;
    }
  }
}
