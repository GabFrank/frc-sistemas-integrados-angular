import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { TerminalPos } from "../terminal-pos.model";
import { TerminalPosService } from "../terminal-pos.service";

export class AddTerminalPosData {
  terminalPos?: TerminalPos;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-scan-terminal-pos-dialog",
  templateUrl: "./scan-terminal-pos-dialog.component.html",
  styleUrls: ["./scan-terminal-pos-dialog.component.scss"],
})
export class ScanTerminalPosDialogComponent implements OnInit {

  formGroup: FormGroup;

  //Form Controls
  codigoControl = new FormControl(null, Validators.required);
  selectedTerminalPos: TerminalPos;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddTerminalPosData,
    private matDialogRef: MatDialogRef<ScanTerminalPosDialogComponent>,
    private terminalPosService: TerminalPosService
  ) {
    if (data?.terminalPos != null) {
      this.selectedTerminalPos = data.terminalPos;
    }
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      codigo: this.codigoControl
    });
  }

  onCancel() {
    this.matDialogRef.close();
  }
}
