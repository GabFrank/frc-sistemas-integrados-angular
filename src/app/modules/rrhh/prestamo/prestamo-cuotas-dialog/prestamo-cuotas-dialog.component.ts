import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { Prestamo, PrestamoCuota } from '../prestamo.model';
import { PrestamoService } from '../prestamo.service';

export interface PrestamoCuotasDialogData {
  prestamo: Prestamo;
}

/** Fila de la tabla: clon de la cuota (Apollo congela los resultados) con lo que el template necesita. */
interface CuotaFila extends PrestamoCuota {
  puedeCobrar: boolean;
}

@UntilDestroy()
@Component({
  selector: 'app-prestamo-cuotas-dialog',
  templateUrl: './prestamo-cuotas-dialog.component.html',
  styleUrls: ['./prestamo-cuotas-dialog.component.scss']
})
export class PrestamoCuotasDialogComponent implements OnInit {

  prestamo: Prestamo;
  displayedColumns = ['numero', 'fechaVencimiento', 'monto', 'montoPagado', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<CuotaFila>([]);

  cajas: CajaVirtual[] = [];
  cajaControl = new FormControl(null);

  /** Un cobro en vuelo: un segundo clic no manda otro (issue central #299). */
  cobrando = false;
  /**
   * Las cuotas no llegaron (tambien la recarga que sigue a un cobro): la tabla se vacia para que
   * no quede una cuota cobrable con el monto viejo, y se ofrece «Reintentar» (#390).
   */
  cargaFallo = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PrestamoCuotasDialogData,
    private dialogRef: MatDialogRef<PrestamoCuotasDialogComponent>,
    private prestamoService: PrestamoService,
    private cajaVirtualService: CajaVirtualService,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) {
    this.prestamo = data.prestamo;
  }

  ngOnInit(): void {
    this.cargarCuotas();
    this.cajaVirtualService.onGetActivas()
      .pipe(untilDestroyed(this))
      .subscribe((res: CajaVirtual[]) => { this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR'); });
  }

  cargarCuotas() {
    this.prestamoService.onGetCuotas(this.prestamo.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          if (res == null) { this.cuotasNoCargadas(); return; }
          this.cargaFallo = false;
          this.dataSource.data = res.map((c: PrestamoCuota) => ({
            ...c,
            puedeCobrar: c.estado !== 'PAGADA' && c.estado !== 'CANCELADA',
          }));
        },
        error: () => this.cuotasNoCargadas()
      });
  }

  private cuotasNoCargadas() {
    this.cargaFallo = true;
    this.dataSource.data = [];
    this.notificacion.notification$.next({
      texto: 'No se pudieron cargar las cuotas del préstamo. Usá «Reintentar».',
      color: NotificacionColor.warn, duracion: 5
    });
  }

  onCobrar(cuota: CuotaFila) {
    if (this.cobrando) return;
    if (this.cajaControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione la Caja Mayor', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    const pendiente = (cuota.monto || 0) - (cuota.montoPagado || 0);
    this.dialogosService.confirm(
      'Cobrar cuota',
      '¿Cobrar la cuota #' + cuota.numero + ' por ' + pendiente + '?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true && !this.cobrando) {
        this.cobrando = true;
        // Va el monto pagado que muestra la pantalla: si la cuota cambió, el central rechaza sin tocar la caja.
        // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
        this.prestamoService.onCobrarCuota(cuota.id, this.cajaControl.value, pendiente, cuota.montoPagado || 0)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: ok => {
              this.cobrando = false;
              if (ok) this.cargarCuotas();
            },
            // Se recarga igual: si el rechazo fue porque la cuota cambió, la pantalla tiene que mostrar lo nuevo.
            error: () => {
              this.cobrando = false;
              this.cargarCuotas();
            },
          });
      }
    });
  }

  onCerrar() {
    this.dialogRef.close(true);
  }
}
