import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin } from 'rxjs';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { CajaVirtual } from '../../../financiero/caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../../financiero/caja-virtual/caja-virtual.service';
import { SolicitudPago } from '../../compra/gestion-compras/solicitud-pago.model';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';

export interface AsignarCajaSolicitudDialogData {
  solicitudPago: SolicitudPago;
}

/**
 * Tesorería asigna una solicitud de pago a una caja para que la pague su operador (rol TESORERIA CAJA),
 * que solo ve las solicitudes asignadas a sus cajas. «Sin asignar» la devuelve a tesorería.
 */
@UntilDestroy()
@Component({
  selector: 'app-asignar-caja-solicitud-dialog',
  templateUrl: './asignar-caja-solicitud-dialog.component.html',
  styleUrls: ['./asignar-caja-solicitud-dialog.component.scss']
})
export class AsignarCajaSolicitudDialogComponent implements OnInit {

  /** Deshabilitado hasta leer la asignación actual: no se elige a ciegas. */
  cajaControl = new FormControl<number | null>({ value: null, disabled: true });
  cajaList: CajaVirtual[] = [];
  cargando = true;
  /** No se pudo leer la asignación actual o las cajas: no se deja guardar a ciegas. */
  cargaFallo = false;
  guardando = false;
  cajaActualNombre: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<AsignarCajaSolicitudDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AsignarCajaSolicitudDialogData,
    private solicitudPagoService: SolicitudPagoService,
    private cajaVirtualService: CajaVirtualService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      asignada: this.solicitudPagoService.onGetCajaAsignada(this.data.solicitudPago.id),
      cajas: this.cajaVirtualService.onGetActivas(PROPAGAR_ERROR_DE_RED),
    }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.cargando = false;
        if (res.asignada == null || res.cajas == null) { this.noCargo(); return; }
        this.cajaList = res.cajas;
        this.cajaActualNombre = res.asignada.cajaVirtualAsignadaNombre || null;
        const actual = res.asignada.cajaVirtualAsignadaId;
        // Los ids llegan como texto o número según la consulta: se compara por texto y se usa el de la lista.
        let caja = actual != null ? this.cajaList.find(c => String(c.id) === String(actual)) : null;
        if (actual != null && !caja) {
          // Asignada a una caja que este usuario no ve: se la muestra igual, para que guardar no la desasigne.
          caja = { id: actual, nombre: this.cajaActualNombre || ('Caja #' + actual) } as CajaVirtual;
          this.cajaList = [caja, ...this.cajaList];
        }
        this.cajaControl.setValue(caja ? caja.id : null);
        this.cajaControl.enable();
      },
      error: () => { this.cargando = false; this.noCargo(); }
    });
  }

  private noCargo() {
    this.cargaFallo = true;
    this.notificacion.openWarn('No se pudo leer la asignación de la solicitud. Cerrá y volvé a intentar.', 5);
  }

  onGuardar() {
    if (this.cargando || this.cargaFallo || this.guardando) return;
    this.guardando = true;
    this.solicitudPagoService.onAsignarACaja(this.data.solicitudPago.id, this.cajaControl.value)
      .pipe(untilDestroyed(this)).subscribe({
        next: res => {
          this.guardando = false;
          if (res == null) {
            this.notificacion.openWarn('No se pudo confirmar la asignación. Revisá la solicitud antes de reintentar.', 5);
            return;
          }
          this.notificacion.openSucess(res.cajaVirtualAsignadaId != null
            ? 'Solicitud asignada a ' + (res.cajaVirtualAsignadaNombre || 'la caja')
            : 'Solicitud sin caja asignada');
          this.dialogRef.close(true);
        },
        // El rechazo del central ya lo avisó el genérico; acá solo se libera el botón.
        error: () => { this.guardando = false; }
      });
  }

  onCancelar() {
    this.dialogRef.close(null);
  }
}
