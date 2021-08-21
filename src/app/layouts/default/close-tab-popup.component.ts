import { Component, Inject, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

export interface DialogData {
  res: boolean;
}

@Component({
  selector: 'app-close-tab-popup',
  templateUrl: './close-tab-popup.html',
  // styleUrls: ['./close-tab-popup.scss']
})
export class CloseTabPopupComponent {

  constructor(public dialogRef: MatDialogRef<CloseTabPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData){}

    onNoClick(): void {
      this.dialogRef.close();
    }

}
