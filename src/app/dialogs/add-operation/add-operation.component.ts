// src/app/dialogs/add-operation/add-operation.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialog
} from '@angular/material/dialog';
import { CommonModule }              from '@angular/common';
import { MatFormFieldModule }        from '@angular/material/form-field';
import { MatInputModule }            from '@angular/material/input';
import { MatButtonModule }           from '@angular/material/button';
import { MatIconModule }             from '@angular/material/icon';

import { OperationModel }            from '../../models/operations/operation';
import { OperationService }          from '../../services/operation.service';
import { Timestamp }                 from '@angular/fire/firestore';

// For cropping + compression:
import { CropperComponent }          from '../cropper/cropper.component';
import { ImageCroppedEvent }         from 'ngx-image-cropper';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-add-operation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './add-operation.component.html',
  styleUrls: ['./add-operation.component.scss']
})
export class AddOperationComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;

  // Keep track of the existing URL (if editing)
  existingProfileUrl: string | null = null;

  // For when user selects and crops a new image
  selectedFile: File | null = null;
  croppedFile: File | null  = null;
  croppedBase64 = '';  // new image preview as base64
end: "center"|"start"|"end"|undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddOperationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OperationModel | null,
    private svc: OperationService,
    private dialog: MatDialog
  ) {
    this.isEdit = !!data;
  }

  ngOnInit() {
    this.form = this.fb.group({
      name:        [this.data?.name || '', Validators.required],
      description: [this.data?.description || '', Validators.required]
    });

    if (this.isEdit && this.data?.profileImageUrl) {
      // If editing, load the existing URL for preview
      this.existingProfileUrl = this.data.profileImageUrl;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.openCropper(this.selectedFile!);
    }
  }

  openCropper(file: File) {
    const dialogRef = this.dialog.open(CropperComponent, {
      width: '800px',
      data: { file },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((cf: File | undefined) => {
      if (cf) {
        this.croppedFile = cf;

        // Clear out the “existing” preview if a new file was chosen
        this.existingProfileUrl = null;

        // Generate a base64 preview for the newly cropped file
        const reader = new FileReader();
        reader.onload = () => {
          this.croppedBase64 = (reader.result as string) || '';
        };
        reader.readAsDataURL(cf);
      }
    });
  }

  async save() {
    if (this.form.invalid) return;

    const { name, description } = this.form.value;
    let profileUrl = this.existingProfileUrl ?? '';

    // If user cropped a brand‐new image, upload it
    if (this.croppedFile) {
      try {
        profileUrl = await this.svc.uploadProfileImage(this.croppedFile);
      } catch (err) {
        console.error('Image upload failed', err);
        return;
      }
    }

    if (this.isEdit && this.data) {
      // Update operation (preserve createdAt)
      const updatedOp: OperationModel = {
        id: this.data.id,
        name: name,
        description: description,
        profileImageUrl: profileUrl,
        createdAt: this.data.createdAt,
        updatedAt: Timestamp.now()
      };
      await this.svc.updateOperation(updatedOp);
      this.dialogRef.close(updatedOp);
    } else {
      // Create new operation (serverTimestamp sets createdAt + updatedAt)
      const newOpObj: Omit<OperationModel, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name,
        description: description,
        profileImageUrl: profileUrl
      };
      const newOp = await this.svc.addOperation(newOpObj);
      this.dialogRef.close(newOp);
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
