import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { debounceTime, distinctUntilChanged, filter, map, tap } from "rxjs/operators";
import { TerminalPos } from "../terminal-pos.model";
import { TerminalPosService } from "../terminal-pos.service";

/**
 * Largo minimo antes de intentar la busqueda. El codigo mas corto en uso es del estilo
 * TPOS-XXX-00; buscar con uno o dos caracteres consultaria por prefijos que matchean varias
 * terminales (el filtro del backend usa LIKE) y podria confirmar la equivocada.
 */
const LARGO_MINIMO_CODIGO = 4;

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

    // Auto-búsqueda real. Antes este subscribe SOLO limpiaba el estado pese al comentario que
    // decía que auto-buscaba: lo único que confirmaba era el (ngSubmit) del form, o sea Enter.
    // Como el HTML tampoco tenía botón de confirmar, un lector sin sufijo CR dejaba al cajero
    // mirando el código en pantalla sin ninguna forma de seguir salvo cancelar. Funcionaba de
    // casualidad, porque los lectores del PDV mandan Enter al final.
    //
    // El debounce evita disparar una consulta por cada carácter que escupe el lector; 350 ms es
    // más que el tiempo entre teclas de un wedge y menos de lo que tarda una persona en notarlo.
    this.codigoControl.valueChanges
      .pipe(
        tap(() => {
          this.selectedTerminalPos = null;
          this.noEncontrado = false;
        }),
        map((valor: string) => (valor || '').trim()),
        filter((valor: string) => valor.length >= LARGO_MINIMO_CODIGO),
        debounceTime(350),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe(() => this.onConfirmar());
  }

  onConfirmar() {
    if (this.formGroup.invalid) return;
    // La auto-busqueda y el boton (y el Enter del lector) llaman al mismo metodo: sin esta
    // guarda, un lector que manda CR dispara dos consultas para el mismo codigo.
    if (this.buscando) return;

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
