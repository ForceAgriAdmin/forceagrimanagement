import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { OperationModel } from '../../models/operations/operation';
import { OperationService } from '../../services/operation.service';
import { WorkersService } from '../../services/workerservice.service';
import { CardService } from '../../services/card.service';
import { CropperComponent } from '../cropper/cropper.component';

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
  croppedFile: File | null = null;
  operations: OperationModel[] = [];
end: "center"|"start"|"end"|undefined;

  constructor(
    private fb: FormBuilder,
    private operationService: OperationService,
    private workersService: WorkersService,
    private cardService: CardService,
    private dialog: MatDialog,
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

      this.openCropper(this.selectedFile);
    }
  }

  //use selectedfie to Open Cropper 
  openCropper(f: File ){
     const dialogRef = this.dialog.open(CropperComponent, {
      width: '1600px',
      data: { file: f },
      disableClose: true
    });

   dialogRef.afterClosed().subscribe((cf: File | undefined) => {
    if (cf) {
      this.croppedFile = cf;
    }
  });
  }

  onSubmit(): void {
    if (this.workerForm.valid) {
      if (this.croppedFile) {
        // Upload the image to Firebase Storage
        this.workersService.uploadProfileImage(this.croppedFile)
          .then(url => {
            const workerData = {
              ...this.workerForm.value,
              farmId: 'LRXY7Su8v0ga6U8OwxJT',   // Set automatically in the background
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
        //TODO: Error message
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
