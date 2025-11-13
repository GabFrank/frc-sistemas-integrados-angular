import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoginComponent } from '../../modules/login/login.component';

@Injectable({
  providedIn: 'root'
})
export class LoginDialogService {
  private currentDialogRef: MatDialogRef<LoginComponent> | null = null;

  constructor(private matDialog: MatDialog) {}

  /**
   * Abre el diálogo de login de manera segura, evitando múltiples diálogos abiertos
   * @returns MatDialogRef<LoginComponent> | null
   */
  openLoginDialog(): MatDialogRef<LoginComponent> | null {
    try {
      if (this.currentDialogRef && !this.currentDialogRef.getState()) {
        return this.currentDialogRef;
      }
      this.closeLoginDialog();
      this.currentDialogRef = this.matDialog.open(LoginComponent, {
        width: "80%",
        maxWidth: "900px",
        disableClose: true,
      });
      this.currentDialogRef.afterClosed().subscribe(() => {
        this.currentDialogRef = null;
      });

      return this.currentDialogRef;
    } catch (error) {
      console.error('Error opening login dialog:', error);
      return null;
    }
  }
  closeLoginDialog(): void {
    try {
      if (this.currentDialogRef) {
        this.currentDialogRef.close();
        this.currentDialogRef = null;
      }
    } catch (error) {
      console.error('Error closing login dialog:', error);
    }
  }
  isLoginDialogOpen(): boolean {
    return this.currentDialogRef != null && !this.currentDialogRef.getState();
  }
}
