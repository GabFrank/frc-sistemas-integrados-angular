import { Injectable } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DialogosComponent } from './dialogos.component';

@Injectable({
  providedIn: 'root'
})
export class DialogosService {

  private dialogRef: MatDialogRef<DialogosComponent>;

  constructor(private dialog: MatDialog) { }

  public confirm(title: string, message1: string, message2?: string, listMessages?: string[], action?: boolean, btn1Name?: string, btn2Name?: string): Observable<any> {
    this.dialogRef = this.dialog.open(DialogosComponent, {
      autoFocus: false,
      restoreFocus: true,
      data: {
        title,
        message1,
        message2,
        listMessages,
        action,
        btn1Name,
        btn2Name
      }
    });
    
    return this.dialogRef.afterClosed();

  }}
