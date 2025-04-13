import { Component, OnInit } from '@angular/core';
import { WorkersService } from '../../../services/workerservice.service'; 
import { WorkerModel } from '../../../models/workers/worker';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-workerslist',
  imports: [
    CommonModule,
    MatListModule
  ],
  templateUrl: './workerslist.component.html',
  styleUrl: './workerslist.component.scss'
})
export class WorkerslistComponent implements OnInit{
  workers: WorkerModel[] = [];

  constructor(private workersService: WorkersService) {}

  ngOnInit(): void {
    // Subscribe to the workers observable
    this.workersService.getWorkers().subscribe((data: WorkerModel[]) => {
      this.workers = data;
    });
  }
}
