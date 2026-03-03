import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';
import { SolicitudPago, SolicitudPagoEstado } from '../../compra/gestion-compras/solicitud-pago.model';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

@Component({
  selector: 'app-gestion-pago-dialog',
  templateUrl: './gestion-pago-dialog.component.html',
  styleUrls: ['./gestion-pago-dialog.component.scss']
})
export class GestionPagoDialogComponent implements OnInit {
  form: FormGroup;
  saving = false;

  // TODO: Más opciones serán implementadas futuramente (registro de pago, adjuntar comprobante, etc.)
  estadoOpciones: { value: SolicitudPagoEstado; label: string }[] = [
    { value: SolicitudPagoEstado.PENDIENTE, label: 'Pendiente' },
    { value: SolicitudPagoEstado.PARCIAL, label: 'Parcial' },
    { value: SolicitudPagoEstado.CONCLUIDO, label: 'Concluido' },
    { value: SolicitudPagoEstado.CANCELADO, label: 'Cancelado' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GestionPagoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { solicitudPago: SolicitudPago },
    private solicitudPagoService: SolicitudPagoService,
    private notificacionService: NotificacionSnackbarService
  ) {
    this.form = this.fb.group({
      estado: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data?.solicitudPago?.estado) {
      this.form.patchValue({ estado: this.data.solicitudPago.estado });
    }
  }

  onGuardar(): void {
    if (this.form.invalid || !this.data?.solicitudPago?.id) return;
    this.saving = true;
    const estado = this.form.get('estado').value as SolicitudPagoEstado;
    this.solicitudPagoService.onActualizarEstado(this.data.solicitudPago.id, estado).subscribe({
      next: () => {
        this.notificacionService.openSucess('Estado actualizado');
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
        this.notificacionService.openAlgoSalioMal('Error al actualizar estado');
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close(false);
  }
}
