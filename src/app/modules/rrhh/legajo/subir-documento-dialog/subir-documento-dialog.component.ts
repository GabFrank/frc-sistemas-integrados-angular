import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { LegajoService } from '../legajo.service';
import { FuncionarioDocumentoTipo } from '../legajo.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export interface SubirDocumentoDialogData { funcionarioId: number; }

@UntilDestroy()
@Component({
  selector: 'app-subir-documento-dialog',
  templateUrl: './subir-documento-dialog.component.html',
  styleUrls: ['./subir-documento-dialog.component.scss']
})
export class SubirDocumentoDialogComponent {

  tipos: FuncionarioDocumentoTipo[] = ['CEDULA', 'CONTRATO', 'CERTIFICADO', 'CV', 'ANTECEDENTES', 'CARNET_SALUD', 'TITULO_ACADEMICO', 'OTRO'];
  tipoControl = new FormControl('OTRO', Validators.required);
  vencimientoControl = new FormControl(null);
  observacionControl = new FormControl(null);

  nombreArchivo: string = null;
  contenidoBase64: string = null;
  mimeType: string = null;
  tamanoBytes: number = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SubirDocumentoDialogData,
    private dialogRef: MatDialogRef<SubirDocumentoDialogComponent>,
    private legajoService: LegajoService,
    private notificacion: NotificacionSnackbarService
  ) { }

  onArchivoSeleccionado(event: any) {
    const file: File = event?.target?.files?.[0];
    if (!file) { return; }
    this.nombreArchivo = file.name;
    this.mimeType = file.type;
    this.tamanoBytes = file.size;
    const reader = new FileReader();
    reader.onload = () => { this.contenidoBase64 = reader.result as string; };
    reader.readAsDataURL(file);
  }

  onGuardar() {
    if (this.contenidoBase64 == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione un archivo', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    const input = {
      funcionarioId: this.data.funcionarioId,
      tipo: this.tipoControl.value,
      nombreArchivo: this.nombreArchivo,
      contenidoBase64: this.contenidoBase64,
      mimeType: this.mimeType,
      tamanoBytes: this.tamanoBytes,
      vencimiento: this.vencimientoControl.value ? dateToString(this.vencimientoControl.value) : null,
      observacion: this.observacionControl.value ? this.observacionControl.value.toUpperCase() : null
    };
    this.legajoService.onSaveDocumento(input).pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }

  onCancelar() { this.dialogRef.close(); }
}
