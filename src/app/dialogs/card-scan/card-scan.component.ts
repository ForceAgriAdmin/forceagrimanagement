import { Component, Inject } from '@angular/core';
import { MatDialogRef,MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, Validators,FormGroup ,ReactiveFormsModule} from '@angular/forms';

export interface CardScanDialogData {
  workerId?: string | null;
}

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule],
  selector: 'app-card-scan',
  templateUrl: './card-scan.component.html',
})
export class CardScanComponent {
  cardNumberControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{20}$/),
  ]);

  constructor(
    public dialogRef: MatDialogRef<CardScanComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CardScanDialogData
  ) {}

  onSubmit(): void {
    if (this.cardNumberControl.valid) {
      const cardNumber = this.cardNumberControl.value;
      this.dialogRef.close({ cardNumber });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
