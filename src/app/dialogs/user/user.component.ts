import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { MatCheckboxModule }    from '@angular/material/checkbox';

export interface DialogData {
  uid?: string;
  email?: string;
  displayName?: string;
  roles?: string[];
}

@Component({
  selector: 'app-user',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit {
  userForm!: FormGroup;
  isEdit = false;
  tempPassword!: string;
allRoles = ['SuperAdmin', 'Admin', 'Manager', 'User'];

end: "center"|"start"|"end"|undefined;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data?.uid;

    // generate a 16-char random password for new users
    this.tempPassword = Array(16)
      .fill(0)
      .map(() =>
        String.fromCharCode(
          Math.floor(Math.random() * (126 - 33)) + 33
        )
      )
      .join('');

    const roleGroup: any = {};
    this.allRoles.forEach(r => {
      roleGroup[r] = [
        this.data?.roles?.includes(r) ?? (r === 'User'),
        r === 'User' ? { disabled: true } : []
      ];
    });

    const roles = this.data?.roles ?? ['User'];

    this.userForm = this.fb.group(
      {
        firstName: [
          this.data?.displayName?.split(' ')[0] || '',
          Validators.required
        ],
        lastName: [
          this.data?.displayName?.split(' ')[1] || '',
          Validators.required
        ],
        email: [
          this.data?.email || '',
          [Validators.required, Validators.email]
        ],
        confirmEmail: [
          this.data?.email || '',
          [Validators.required, Validators.email]
        ],
         roles: this.fb.group({
        SuperAdmin: [roles.includes('SuperAdmin')],        // boolean
        Admin:      [roles.includes('Admin')],             // boolean
        Manager:    [roles.includes('Manager')],           // boolean
        User:       [{ value: true, disabled: true }]      // always true & disabled
      })
      },
      { validators: this.matchEmails }
    );
  }
  

  private matchEmails(group: AbstractControl) {
    const e = group.get('email')?.value;
    const c = group.get('confirmEmail')?.value;
    return e === c ? null : { emailsMismatch: true };
  }

  save() {
    if (this.userForm.invalid) return;

    const { firstName, lastName, email } = this.userForm.value;
    const displayName = `${firstName.trim()} ${lastName.trim()}`;

    // Extract checked roles
    const rolesMap = this.userForm.get('roles')!.value as Record<string, boolean>;
    const roles = this.allRoles.filter(r => rolesMap[r]);

    if (this.isEdit && this.data.uid) {
      this.authService
        .editUser(this.data.uid, { email, displayName, roles })
        .subscribe(() =>
          this.dialogRef.close({ uid: this.data!.uid, email, displayName, roles })
        );
    } else {
      this.authService
        .createUser(email, this.tempPassword, displayName, roles)
        .subscribe(user =>
          this.dialogRef.close({
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName!,
            roles
          })
        );
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
