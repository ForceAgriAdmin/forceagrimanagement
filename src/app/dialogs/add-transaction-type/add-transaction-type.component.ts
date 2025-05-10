import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TransactionsService } from '../../services/transactions.service';

export interface TransactionTypeDialogData {
  id?: string;
  name?: string;
  description?: string;
  isCredit?: boolean;
}


@Component({
  selector: 'app-add-transaction-type',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './add-transaction-type.component.html',
  styleUrl: './add-transaction-type.component.scss'
})
export class AddTransactionTypeComponent  implements OnInit
{
  form!: FormGroup;
  isEdit = false;
  public data: TransactionTypeDialogData;
end: "center"|"start"|"end"|undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddTransactionTypeComponent>,
    @Inject(MAT_DIALOG_DATA)
    raw: TransactionTypeDialogData | null,
    private ts: TransactionsService
  ) {
    this.data = raw ?? {};
    this.isEdit = typeof this.data.id === 'string';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [
        this.data.name || '',
        Validators.required
      ],
      description: [this.data.description || ''],
      isCredit: [this.data.isCredit ?? false]
    });
  }

  save() {
    const { name, description, isCredit } = this.form.value;
    if (this.isEdit && this.data.id) {
      this.ts
        .updateTransactionType(this.data.id, {
          name,
          description,
          isCredit
        })
        .subscribe(() =>
          this.dialogRef.close({
            id: this.data.id!,
            name,
            description,
            isCredit
          })
        );
    } else {
      this.ts
        .createTransactionType({
          name,
          description,
          isCredit
        })
        .subscribe(() =>
          this.dialogRef.close({
            name,
            description,
            isCredit
          })
        );
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
