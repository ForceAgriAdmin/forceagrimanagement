import { Component, Inject } from '@angular/core';
import { WorkerModel } from '../../models/workers/worker';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { WorkersService } from '../../services/workerservice.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-action-worker',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,],
  templateUrl: './action-worker.component.html',
  styleUrl: './action-worker.component.scss',
})
export class ActionWorkerComponent {
  settleForm: FormGroup;
  selectedEventType: string = '';
  selectedEventTypeIcon: string = '';
  settleOptions: { title: string; icon: string }[] = [
  { title: 'Settle', icon: 'check_circle' },
 // { title: 'Created', icon: 'person_add' },
  { title: 'Farm Change', icon: 'agriculture' },
  //{ title: 'Operation Change', icon: 'build' }
];


  constructor(
    public dialogRef: MatDialogRef<ActionWorkerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { worker: WorkerModel },
    private fb: FormBuilder,
    private workersService: WorkersService
  ) {
    this.settleForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required]
    });
  }


  onOptionChange(selected: { title: string; icon: string }) {
  this.settleForm.patchValue({
    title: selected.title
  });
  this.selectedEventType = selected.title;
}

submit() {
  if (this.settleForm.valid) {
    const formData = this.settleForm.value;
    
    this.dialogRef.close(formData);
  }
}
}
