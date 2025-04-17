import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { OperationService } from '../../services/operation.service';
import { OperationModel } from '../../models/operations/operation';
import { WorkersService } from '../../services/workerservice.service';

@Component({
  selector: 'app-add-worker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './add-worker.component.html',
  styleUrls: ['./add-worker.component.scss']
})
export class AddWorkerComponent implements OnInit {
  workerForm: FormGroup;
  selectedFile: File | null = null;
  operations: OperationModel[] = [];
end: "center"|"start"|"end"|undefined;

  constructor(
    private fb: FormBuilder,
    private operationService: OperationService,
    private workersService: WorkersService,
    private dialogRef: MatDialogRef<AddWorkerComponent>
  ) {
    // Note: profileImageUrl is not in the form since that comes from file upload.
    this.workerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      idNumber: ['', Validators.required],
      employeeNumber: ['', Validators.required],
      operationId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.operationService.getOperations().subscribe((ops: OperationModel[]) => {
      this.operations = ops;
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit(): void {
    if (this.workerForm.valid) {
      if (this.selectedFile) {
        // Upload the image to Firebase Storage
        this.workersService.uploadProfileImage(this.selectedFile)
          .then(url => {
            const workerData = {
              ...this.workerForm.value,
              farmId: 'fixedFarmID',   // Set automatically in the background
              currentBalance: 0,       // Always zero when adding a new worker
              profileImageUrl: url
            };
            this.dialogRef.close(workerData);
          })
          .catch(error => {
            console.error('Image upload failed', error);
            // Optionally notify the user of the failure.
          });
      } else {
        // No file selected – use an empty string or default image URL
        const workerData = {
          ...this.workerForm.value,
          farmId: 'fixedFarmID',
          currentBalance: 0,
          profileImageUrl: ''
        };
        this.dialogRef.close(workerData);
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
