import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { WorkersService } from '../../services/workerservice.service';
export interface WorkerTypeDialogData {
  id?: string;
  description?: string;
}
@Component({
  selector: 'app-add-worker-type',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './add-worker-type.component.html',
  styleUrl: './add-worker-type.component.scss'
})
export class AddWorkerTypeComponent implements OnInit
{
  workerForm!: FormGroup;
  isEdit = false;
  public data: WorkerTypeDialogData;
end: "center"|"start"|"end"|undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddWorkerTypeComponent>,
    @Inject(MAT_DIALOG_DATA)
    rawData: WorkerTypeDialogData | null,
    private ws: WorkersService
  ) {
    this.data = rawData ?? {};
    this.isEdit = typeof this.data.id === 'string';
  }

  ngOnInit(): void {
    this.workerForm = this.fb.group({
      description: [
        this.data.description || '',
        Validators.required
      ]
    });
  }

  save() {
    const desc = this.workerForm.value.description.trim();
    if (this.isEdit && this.data.id) {
      this.ws
        .updateWorkerType(this.data.id, desc)
        .subscribe(() =>
          this.dialogRef.close({
            id: this.data.id!,
            description: desc
          })
        );
    } else {
      this.ws
        .createWorkerType(desc)
        .subscribe(rec =>
          this.dialogRef.close(rec)
        );
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
