import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';



@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  showInfo(message: string, duration: number = 3000) {
    this.openSnackBar(message, 'info-snackbar', duration);
  }

  showSuccess(message: string, duration: number = 3000) {
    this.openSnackBar(message, 'success-snackbar', duration);
  }

  showWarning(message: string, duration: number = 3000) {
    this.openSnackBar(message, 'warning-snackbar', duration);
  }

  showError(message: string, duration: number = 3000) {
    this.openSnackBar(message, 'error-snackbar', duration);
  }

  private openSnackBar(message: string, panelClass: string, duration: number) {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: [panelClass],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    };

    this.snackBar.open(message, 'Close', config);
  }
}
