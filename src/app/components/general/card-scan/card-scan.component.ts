import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
export interface CardScanDialogData {
  workerId?: string | null;
}

@Component({
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
