import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { OperationModel } from '../../models/operations/operation';
import { OperationService } from '../../services/operation.service';
import { WorkersService } from '../../services/workerservice.service';
import { CropperComponent } from '../cropper/cropper.component';
import { AuthService } from '../../services/auth.service';
import { AppUser } from '../../models/users/user.model';
import { Timestamp } from '@angular/fire/firestore';
import { WorkerTypeModel } from '../../models/workers/worker-type';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-add-worker',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
  workerTypes: WorkerTypeModel[] =[];
end: "center"|"start"|"end"|undefined;
loggedInUser: AppUser = {
        uid: '',
        email: '',
        displayName: '',
        createdAt: Timestamp.now(),
        farmId: '',
        roles: []
      };
  constructor(
    private fb: FormBuilder,
    private operationService: OperationService,
    private workersService: WorkersService,
    private authService: AuthService,
    private dialog: MatDialog,
     private router: Router,
     private notify: NotificationService,
    private dialogRef: MatDialogRef<AddWorkerComponent>
  ) {
    // Note: profileImageUrl is not in the form since that comes from file upload.
    this.workerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      idNumber: ['', Validators.required],
      employeeNumber: ['', Validators.required],
      operationId: ['', Validators.required],
      workerTypeId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.authService.currentUserDoc$.subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.loggedInUser = user;
      }
    });
    this.operationService.getOperations().subscribe((ops: OperationModel[]) => {
      this.operations = ops;
    });
     this.workersService.getWorkerTypes().subscribe((types: WorkerTypeModel[]) => {
      this.workerTypes = types;
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
        this.workersService.uploadProfileImage(this.croppedFile)
          .then(url => {
            const workerData = {
              ...this.workerForm.value,
              operationId: this.workerForm.value.operationId,
              workerTypeId: this.workerForm.value.workerTypeId,
              farmId: this.loggedInUser.farmId,
              currentBalance: 0,
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
