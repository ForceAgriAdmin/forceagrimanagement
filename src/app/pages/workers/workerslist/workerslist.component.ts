import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WorkersService } from '../../../services/workerservice.service'; 
import { WorkerModel } from '../../../models/workers/worker';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { OperationModel } from '../../../models/operations/operation';
import { OperationService } from '../../../services/operation.service';
import {ForceButtonComponent} from '../../../components/general/forcebutton/forcebutton.component'
import {ForceSearchComponent} from '../../../components/general/force-search/force-search.component'

import { AddWorkerComponent } from '../../../dialogs/add-worker/add-worker.component'; // adjust the path accordingly
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-workerslist',
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ForceButtonComponent,
    ForceSearchComponent
  ],
  templateUrl: './workerslist.component.html',
  styleUrl: './workerslist.component.scss'
})
export class WorkerslistComponent implements OnInit{
  workers: WorkerModel[] = [];
  filteredWorkers: WorkerModel[] = [];
  searchTerm: string = '';
  operationMap: { [id: string]: string } = {};
  constructor(private workersService: WorkersService,private operationService: OperationService, private dialog: MatDialog,private router: Router) {}

  ngOnInit(): void {
    this.workersService.getWorkers().subscribe((data: WorkerModel[]) => {
      this.workers = data;
      this.filteredWorkers = data; 
    });
    this.operationService.getOperations().subscribe((ops: OperationModel[]) => {
      ops.forEach(op => {
        this.operationMap[op.id] = op.name;
      });
    });

  }

  filterWorkers(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredWorkers = this.workers;
      return;
    }
    const term = searchTerm.toLowerCase();
    this.filteredWorkers = this.workers.filter((worker) => {
      const firstName = worker.firstName.toLowerCase();
      const lastName = worker.lastName.toLowerCase();
      const operation = this.getOperationName(worker.operationId).toLowerCase();
      return (
        firstName.includes(term) ||
        lastName.includes(term) ||
        operation.includes(term)
      );
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredWorkers = this.workers;
  }

  onAddNewWorker(): void {
    const dialogRef = this.dialog.open(AddWorkerComponent, {
      width: '1600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
         this.workersService.addWorker(result).then(() => { /* refresh list if needed */ });
      }
    });
  }

  onAddTransaction(worker: WorkerModel) {
    console.log('Add money to', worker.firstName);
    // Or open a dialog, redirect, etc.
  }
  
  onEdit(worker: WorkerModel) {
    this.router.navigate(
      ['/workers', 'list', 'edit', worker.id]
    );
  }
  
  onRemove(worker: WorkerModel) {
    console.log('Remove worker', worker.firstName);
    // ...
  }

  getOperationName(operationId: string): string {
    return this.operationMap[operationId] || 'Unknown';
  }
}
