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
  MatDialogRef
} from '@angular/material/dialog';
import { CommonModule }              from '@angular/common';
import { MatFormFieldModule }        from '@angular/material/form-field';
import { MatInputModule }            from '@angular/material/input';
import { MatButtonModule }           from '@angular/material/button';

import { OperationModel }            from '../../models/operations/operation';
import { OperationService }          from '../../services/operation.service';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-add-operation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './add-operation.component.html',
  styleUrls: ['./add-operation.component.scss']
})
export class AddOperationComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
end: "center"|"start"|"end"|undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddOperationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OperationModel | null,
    private svc: OperationService
  ) {
    this.isEdit = !!data;
  }

  ngOnInit() {
    this.form = this.fb.group({
      name:        [this.data?.name || '', Validators.required],
      description: [this.data?.description || '', Validators.required]
    });
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value;

    if (this.isEdit && this.data) {
      this.svc.updateOperation({ id: this.data.id, ...v }).then(() => {
        // push back the updated model (keep createdAt the same)
        this.dialogRef.close({
          id: this.data!.id,
          name: v.name,
          description: v.description,
          createdAt: this.data!.createdAt,
          updatedAt: Timestamp.now(),
        } as OperationModel);
      });
    } else {
      this.svc.addOperation(v).then(newOp => {
        this.dialogRef.close(newOp);
      });
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
