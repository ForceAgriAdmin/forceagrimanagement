import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface YesNoData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-yes-no',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './yes-no.component.html',
  styleUrl: './yes-no.component.scss'
})
export class YesNoComponent {
end: "center"|"start"|"end"|undefined;

  
constructor(
    private dialogRef: MatDialogRef<YesNoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: YesNoData
  ) {}

  confirm() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
