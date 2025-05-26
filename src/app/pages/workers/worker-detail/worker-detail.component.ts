// src/app/pages/worker-detail/worker-detail.component.ts
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
import { TransactionListComponent } from '../worker-transaction-list/worker-transaction-list.component';
import { WorkerIdentityCardComponent } from '../worker-identity-card/worker-identity-card.component';
import { WorkerTimelineComponent }  from '../worker-timeline/worker-timeline.component';
import { WorkerDetailsCardComponent } from '../worker-details-card/worker-details-card.component';

import { FarmModel }      from '../../../models/farms/farm';
import { OperationModel } from '../../../models/operations/operation';
import { TimelineEvent }  from '../../../models/workers/timelineevent';
import { WorkerModel }    from '../../../models/workers/worker';

import { WorkersService }    from '../../../services/workerservice.service';
import { OperationService }  from '../../../services/operation.service';
import { FarmService }       from '../../../services/farm.service';
import { WorkerTypeModel }   from '../../../models/workers/worker-type';

import { CardConfig, PrintingService } from '../../../services/printing.service';
import { CardService }                from '../../../services/card.service';
import { firstValueFrom }             from 'rxjs';

// (you can remove these if you’re not using them in this file)
import { BarcodeGenerator, QRCodeGenerator } from '@syncfusion/ej2-angular-barcode-generator';
import JsBarcode from 'jsbarcode';
import QRCode   from 'qrcode';

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
  workerTypes: WorkerTypeModel[] = [];
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
    private fs: FarmService,
    private printingService: PrintingService,
    private cs: CardService
  ) {}

  ngOnInit() {
    // build the form
    this.form = this.fb.group({
      firstName:       ['', Validators.required],
      lastName:        ['', Validators.required],
      idNumber:        ['', Validators.required],
      employeeNumber:  ['', Validators.required],
      operationId:     ['', Validators.required],
      workerTypeId:    ['', Validators.required],
      profileImageUrl: ['']
    });

    // load lookups
    this.os.getOperations().subscribe(ops => this.operations = ops);
    this.ws.getWorkerTypes().subscribe(types => this.workerTypes = types);
    this.fs.getFarms().subscribe(f => this.farms = f);

    // fetch the worker
    const id = this.route.snapshot.paramMap.get('id')!;
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
      workerTypeId:    w.workerTypeId,
      profileImageUrl: w.profileImageUrl
    });

    this.events = [
      { actionDate: w.createdAt.toDate(), description: 'Created',      icon: 'person_add' },
      { actionDate: w.updatedAt.toDate(), description: 'Last Updated', icon: 'edit'       }
    ];

    this.loading = false;
  }

  async onAction(actionId: string) {
    switch (actionId) {
      case 'save':
        if (!this.form.valid && !this.form.dirty) {
          // TODO: show error
          return;
        }
        const updateData: Partial<WorkerModel> & { id: string } = {
          ...(this.form.value as Omit<WorkerModel, 'id' | 'createdAt' | 'updatedAt'>),
          id: this.worker.id
        };
        await this.ws.updateWorker(updateData);
        this.loading = false;
        this.router.navigate(['/workers/list']);
        break;

      case 'printCard':
    try {
      const card$ = await this.cs.getWorkerCard(this.worker.id);
      const card  = await firstValueFrom(card$);
      if (!card) throw new Error('No active card found');

      // find the operation + farm
      const operation = this.operations.find(o => o.id === this.worker.operationId);
      const farm      = this.farms.find(f => f.id === this.worker.farmId);

      // ✋ check them!
      if (!operation) {
        console.error('Operation not loaded yet', this.worker.operationId, this.operations);
        return; 
      }
      if (!farm) {
        console.error('Farm not loaded yet', this.worker.farmId, this.farms);
        return;
      }

      const cfg: CardConfig = { worker: this.worker, operation, farm, identityCard: { number: card.number } };
      await this.printingService.printCardOnA4(cfg);
    }
    catch (err) {
      console.error('Print failed:', err);
    }
    finally {
      this.loading = false;
    }
    break;
    }
  }
}
