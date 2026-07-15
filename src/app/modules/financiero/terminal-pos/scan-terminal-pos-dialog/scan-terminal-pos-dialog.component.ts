import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { TerminalPos } from "../terminal-pos.model";
import { TerminalPosService } from "../terminal-pos.service";

export class AddTerminalPosData {
  terminalPos?: TerminalPos;
}

export interface ScanTerminalPosResult {
  terminalPos: TerminalPos;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-scan-terminal-pos-dialog",
  templateUrl: "./scan-terminal-pos-dialog.component.html",
  styleUrls: ["./scan-terminal-pos-dialog.component.scss"],
})
export class ScanTerminalPosDialogComponent implements OnInit {

  formGroup: FormGroup;

  codigoControl = new FormControl(null, Validators.required);
  selectedTerminalPos: TerminalPos = null;
  buscando = false;
  noEncontrado = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddTerminalPosData,
    private matDialogRef: MatDialogRef<ScanTerminalPosDialogComponent>,
    private terminalPosService: TerminalPosService
  ) {
    if (data?.terminalPos != null) {
      this.selectedTerminalPos = data.terminalPos;
      this.codigoControl.setValue(data.terminalPos.codigo);
    }
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      codigo: this.codigoControl
    });

    // Auto-buscar al cambiar el código (útil para lectores de código de barras)
    this.codigoControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.selectedTerminalPos = null;
        this.noEncontrado = false;
      });
  }

  onConfirmar() {
    if (this.formGroup.invalid) return;

    const codigo = this.codigoControl.value?.trim();
    this.buscando = true;
    this.noEncontrado = false;

    this.terminalPosService.onFilter(null, codigo, true, 0, 1, false)
      .pipe(untilDestroyed(this))
      .subscribe((page: any) => {
        this.buscando = false;
        const resultados = page?.getContent ?? page?.data?.getContent ?? [];
        if (resultados.length > 0) {
          this.selectedTerminalPos = resultados[0];
          const result: ScanTerminalPosResult = { terminalPos: this.selectedTerminalPos };
          this.matDialogRef.close(result);
        } else {
          this.noEncontrado = true;
          this.selectedTerminalPos = null;
        }
      }, () => {
        this.buscando = false;
        this.noEncontrado = true;
      });
  }

  onCancel() {
    this.matDialogRef.close();
  }
}
