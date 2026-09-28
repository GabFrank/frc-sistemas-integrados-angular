import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { LiquidacionConcepto } from '../liquidacion-concepto.model';
import { LiquidacionConceptoService } from '../liquidacion-concepto.service';

export interface LiquidacionConceptoDialogData {
  concepto: LiquidacionConcepto;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-liquidacion-concepto-dialog',
  templateUrl: './edit-liquidacion-concepto-dialog.component.html',
  styleUrls: ['./edit-liquidacion-concepto-dialog.component.scss']
})
export class EditLiquidacionConceptoDialogComponent implements OnInit {

  selectedConcepto: LiquidacionConcepto;
  formGroup: FormGroup;
  isEditting = false;

  codigoControl = new FormControl(null, [Validators.required]);
  descripcionControl = new FormControl(null, [Validators.required]);
  esHaberControl = new FormControl(null, [Validators.required]);
  /**
   * Arranca en null a proposito, incluso en el alta: la columna tiene DEFAULT TRUE, asi
   * que un concepto que se guarde sin elegir entra a la base del aguinaldo y del IPS sin
   * que nadie lo haya decidido. El required obliga a que la decision sea explicita.
   */
  esRemunerativoControl = new FormControl(null, [Validators.required]);
  esCalculadoAutoControl = new FormControl(false);
  activoControl = new FormControl(true);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: LiquidacionConceptoDialogData,
    private dialogRef: MatDialogRef<EditLiquidacionConceptoDialogComponent>,
    private liquidacionConceptoService: LiquidacionConceptoService,
    private mainService: MainService
  ) {
    this.selectedConcepto = data?.concepto != null ? data.concepto : new LiquidacionConcepto();
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      codigo: this.codigoControl,
      descripcion: this.descripcionControl,
      esHaber: this.esHaberControl,
      esRemunerativo: this.esRemunerativoControl,
      esCalculadoAuto: this.esCalculadoAutoControl,
      activo: this.activoControl
    });

    if (this.selectedConcepto.id) {
      this.codigoControl.setValue(this.selectedConcepto.codigo);
      this.descripcionControl.setValue(this.selectedConcepto.descripcion);
      this.esHaberControl.setValue(this.selectedConcepto.esHaber);
      this.esRemunerativoControl.setValue(this.selectedConcepto.esRemunerativo);
      this.esCalculadoAutoControl.setValue(this.selectedConcepto.esCalculadoAuto === true);
      this.activoControl.setValue(this.selectedConcepto.activo !== false);
      this.formGroup.disable();
    } else {
      this.isEditting = true;
    }
  }

  onHabilitarEdicion() {
    this.isEditting = true;
    this.formGroup.enable();
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) { return; }
    // Apollo congela los resultados: se clona antes de mutar.
    const aux = new LiquidacionConcepto();
    Object.assign(aux, this.selectedConcepto);
    aux.codigo = this.codigoControl.value?.trim().toUpperCase();
    aux.descripcion = this.descripcionControl.value ? this.descripcionControl.value.toUpperCase() : null;
    aux.esHaber = this.esHaberControl.value;
    aux.esRemunerativo = this.esRemunerativoControl.value;
    aux.esCalculadoAuto = this.esCalculadoAutoControl.value === true;
    aux.activo = this.activoControl.value === true;
    aux.usuario = this.mainService.usuarioActual;

    this.liquidacionConceptoService.onSave(aux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
