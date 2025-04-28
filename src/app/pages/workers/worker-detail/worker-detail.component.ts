import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatGridListModule }  from '@angular/material/grid-list';
import { MatSelectModule }    from '@angular/material/select';
import { MatButtonModule }    from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule }      from '@angular/material/card';

import { ActionToolbarComponent }   from '../../../components/general/action-toolbar/action-toolbar.component';
import { TransactionListComponent } from '../../transactions/transaction-list/transaction-list.component';
import { WorkerIdentityCardComponent } from '../worker-identity-card/worker-identity-card.component';
import { WorkerTimelineComponent }  from '../worker-timeline/worker-timeline.component';
import { WorkerDetailsCardComponent } from '../worker-details-card/worker-details-card.component';

import { FarmModel }      from '../../../models/farms/farm';
import { OperationModel } from '../../../models/operations/operation';
import { TimelineEvent }  from '../../../models/workers/timelineevent';
import { WorkerModel }    from '../../../models/workers/worker';

import { WorkersService } from '../../../services/workerservice.service';
import { OperationService } from '../../../services/operation.service';
import { FarmService }     from '../../../services/farm.service';
export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}
@Component({
  standalone: true,
  selector: 'app-worker-detail',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatGridListModule,
    ActionToolbarComponent,
    TransactionListComponent,
    WorkerIdentityCardComponent,
    WorkerTimelineComponent,
    WorkerDetailsCardComponent
  ],
  templateUrl: './worker-detail.component.html',
  styleUrls: ['./worker-detail.component.scss']
})
export class WorkerDetailComponent implements OnInit {

  form!: FormGroup;
  operations: OperationModel[] = [];
  farms: FarmModel[] = [];
  worker!: WorkerModel;
  loading = true;
  events: TimelineEvent[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private ws: WorkersService,
    private os: OperationService,
    private fs: FarmService
  ) {}

  ngOnInit() {
    // 1) build the form
    this.form = this.fb.group({
      firstName:       ['', Validators.required],
      lastName:        ['', Validators.required],
      idNumber:        ['', Validators.required],
      employeeNumber:  ['', Validators.required],
      operationId:     ['', Validators.required],
      farmId:          ['', Validators.required],
      profileImageUrl: ['']
    });

    // 2) load lookups
    this.os.getOperations().subscribe(ops => this.operations = ops);
    this.fs.getFarms().subscribe(f => this.farms = f);

    const id = this.route.snapshot.paramMap.get('id')!;

    console.log('Worker ID: '+id);
    this.ws.getWorker(id).subscribe(w => {
      if (w) {
        this.initWithWorker(w);
      } else {
        this.loading = false;
      }
    });

  }

  private initWithWorker(w: WorkerModel) {
    this.worker = w;
    this.form.patchValue({
      firstName:       w.firstName,
      lastName:        w.lastName,
      idNumber:        w.idNumber,
      employeeNumber:  w.employeeNumber,
      operationId:     w.operationId,
      farmId:          w.farmId,
      profileImageUrl: w.profileImageUrl
    });

    this.events = [
      { actionDate: w.createdAt.toDate(), description: 'Created',      icon: 'person_add' },
      { actionDate: w.updatedAt.toDate(), description: 'Last Updated', icon: 'edit'       }
    ];

    this.loading = false;
  }

  onAction(actionId: string) {
    if (actionId === 'save' && this.form.valid && this.form.dirty) {
      const updateData: Partial<WorkerModel> & { id: string } = {
        ...(this.form.value as Omit<WorkerModel, 'id' | 'createdAt' | 'updatedAt'>),
        id: this.worker.id
      };
      this.loading = true;
      this.ws.updateWorker(updateData).then(() => {
        this.loading = false;
        this.router.navigate(['/workers/list']);
      });
    }
  }
}
