import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {
  BarcodeGeneratorModule,
  QRCodeGeneratorModule,
  DisplayTextModel
} from '@syncfusion/ej2-angular-barcode-generator';

import { WorkerModel } from '../../../models/workers/worker';
import { FarmService } from '../../../services/farm.service';
import { OperationService } from '../../../services/operation.service';
import { FarmModel } from '../../../models/farms/farm';
import { OperationModel } from '../../../models/operations/operation';
import { Observable } from 'rxjs';
import { IdentityCard } from '../../../models/workers/identitycard';
import { CardService } from '../../../services/card.service';

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
export class WorkerIdentityCardComponent {
  @Input() worker!: WorkerModel;
  operation!: OperationModel;
  farm!: FarmModel;
  workerIdentityCard!: IdentityCard;
  cardUrl: string = '';
  public noText: DisplayTextModel = { visibility: false };


  constructor(private os: OperationService,private fs: FarmService,private cs: CardService){

  }

  async ngOnInit(): Promise<void> {
    this.os
      .getOperation(this.worker.operationId)
      .subscribe(op => {
        if (!op) {
          console.warn(`No operation found for ID ${this.worker.operationId}`);
          return;
        }
        this.operation = op;  // `op` here is now definitely OperationModel
      });
      this.fs
      .getFarm(this.worker.farmId)
      .subscribe(farm => {
        if (!farm) {
          console.warn(`No farm found for ID ${this.worker.farmId}`);
          return;
        }
        this.farm = farm;  // `op` here is now definitely OperationModel
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
  }

  getOperationName(): string {
    return this.operation?.name ?? '—';
  }

  getFarmName(): string {
    return this.farm?.name ?? '—';
  }

  get QrValue(): string {
    return `card:${this.workerIdentityCard.number}workerId:${this.worker.id}farmId:${this.worker.farmId}operationId:${this.worker.operationId}`;
  }

  get BarcodeValue(): string {
    return `${this.workerIdentityCard.number}`;
  }
}
