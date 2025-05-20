import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {
  ImageCropperComponent,
  ImageCroppedEvent
} from 'ngx-image-cropper';
import imageCompression from 'browser-image-compression';
@Component({
  selector: 'app-cropper',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    ImageCropperComponent
  ],
  templateUrl: './cropper.component.html',
  styleUrls: ['./cropper.component.scss']
})
export class CropperComponent {
  public croppedBase64 = '';
end: "center"|"start"|"end"|undefined;
  public croppedFile!: File;
  constructor(
    private dialogRef: MatDialogRef<CropperComponent, File>,
    @Inject(MAT_DIALOG_DATA) public data: { file: File }
  ) {}

onImageCropped(event: ImageCroppedEvent) {
  const blob: Blob = event.blob!;
  const fileName = `cropped_${Date.now()}.png`;  // or derive from original file
  // Wrap the blob in a File:
  this.croppedFile = new File([blob], fileName, { type: blob.type });
}

  onCropperLoadError() {
    console.error('Cropper load error');
  }

 async onUseImage() {
  const ONE_MEGABYTE = 1_048_576;
    const file = this.croppedFile;
    if (file.size > ONE_MEGABYTE) {
      const compressed = await this.compressFile(file);
      this.dialogRef.close(compressed);
    } else {
      this.dialogRef.close(file);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  private async compressFile(inputFile: File): Promise<File> {
    const ONE_MEGABYTE = 1_048_576;
    const options = {
    maxSizeMB:    inputFile.size / ONE_MEGABYTE * 0.8,  
    maxWidthOrHeight: 420,
    useWebWorker: true,
    initialQuality: 0.8
  };

  const compressedBlob = await imageCompression(inputFile, options);
  return new File(
    [compressedBlob],
    `compressed_${inputFile.name}`,
    { type: compressedBlob.type }
  );
  }
}
