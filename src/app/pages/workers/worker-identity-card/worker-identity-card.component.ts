import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {
  BarcodeGeneratorModule,
  QRCodeGeneratorModule,
  DisplayTextModel
} from '@syncfusion/ej2-angular-barcode-generator';
import { Observable } from 'rxjs';

import { WorkerModel } from '../../../models/workers/worker';
import { FarmService } from '../../../services/farm.service';
import { OperationService } from '../../../services/operation.service';
import { CardService } from '../../../services/card.service';

import { FarmModel } from '../../../models/farms/farm';
import { OperationModel } from '../../../models/operations/operation';
import { IdentityCard } from '../../../models/workers/identitycard';
import { WorkersService } from '../../../services/workerservice.service';

@Component({
  standalone: true,
  selector: 'app-worker-identity-card',
  imports: [
    CommonModule,
    MatCardModule,
    BarcodeGeneratorModule,
    QRCodeGeneratorModule
  ],
  templateUrl: './worker-identity-card.component.html',
  styleUrls: ['./worker-identity-card.component.scss']
})
export class WorkerIdentityCardComponent implements OnInit {
  @Input() worker!: WorkerModel;

  // ← new: this will emit the cached (or freshly-fetched) URL
  profileImageUrl$!: Observable<string>;

  operation!: OperationModel;
  farm!: FarmModel;
  workerIdentityCard!: IdentityCard;
  public noText: DisplayTextModel = { visibility: false };

  constructor(
    private os: OperationService,
    private fs: FarmService,
    private cs: CardService,
    private ws: WorkersService    // ← inject your upgraded service
  ) {}

  async ngOnInit(): Promise<void> {
    // 1) kick off your existing lookups
    this.os.getOperation(this.worker.operationId).subscribe(op => {
      if (!op) {
        console.warn(`No operation found for ID ${this.worker.operationId}`);
        return;
      }
      this.operation = op;
    });

    this.fs.getFarm(this.worker.farmId).subscribe(f => {
      if (!f) {
        console.warn(`No farm found for ID ${this.worker.farmId}`);
        return;
      }
      this.farm = f;
    });

     (await this.cs
      .getWorkerCard(this.worker.id))
        .subscribe(card => {
          if (!card) {
            console.warn(`No card found for ID ${this.worker.farmId}`);
            return;
          }
          this.workerIdentityCard = card;  // `op` here is now definitely OperationModel
        });

    // 2) point the img tag at our cache-aware observable
    this.profileImageUrl$ = this.ws.getProfileImageUrl(this.worker.profileImageUrl);
  }

  getOperationName(): string {
    return this.operation?.name ?? '—';
  }

 

  getFarmName(): string {
    return this.farm?.name ?? '—';
  }

  get QrValue(): string {
    return `card:${this.workerIdentityCard.number}` +
           `workerId:${this.worker.id}` +
           `farmId:${this.worker.farmId}` +
           `operationId:${this.worker.operationId}`;
  }

  get BarcodeValue(): string {
    return `${this.workerIdentityCard.number}`;
  }
}
