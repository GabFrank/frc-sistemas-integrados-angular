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

  public confirm(title: string, message1: string, message2?: string, listMessages?: string[], action?: boolean): Observable<any> {
    this.dialogRef = this.dialog.open(DialogosComponent, {
      autoFocus: false,
      restoreFocus: true,
      data: {
        title,
        message1,
        message2,
        listMessages,
        action
      }
    });
    
    return this.dialogRef.afterClosed();

  }}
