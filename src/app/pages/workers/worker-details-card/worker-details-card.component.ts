// src/app/pages/worker-details-card/worker-details-card.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
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
import { Subscription } from 'rxjs';

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
export class WorkerDetailsCardComponent implements OnInit, OnDestroy {
  @Input() worker!: WorkerModel;
  @Input() workerTypes: WorkerTypeModel[] = [];
  @Input() form!: FormGroup;
  @Input() operations: LookupItem[] = [];
  @Input() farms: LookupItem[] = [];

  currentBalance: number = 0;
  private sub?: Subscription;

  constructor(private workerService: WorkersService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.sub = this.workerService.getWorkerLive(this.worker.id).subscribe((w) => {
      this.currentBalance = w.currentBalance;
      this.worker.isActive = w.isActive; // keep isActive updated as well
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

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
      this.notify.showSuccess('Worker status updated successfully');
    } catch (err) {
      this.notify.showError('Failed to update worker status');
      console.error('Failed to update worker status', err);
      this.worker.isActive = !newStatus;
    }
  }
}
