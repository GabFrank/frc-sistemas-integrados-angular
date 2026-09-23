import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { FormatoQrPos } from '../formato-qr-pos.model';
import { FormatoQrPosService } from '../formato-qr-pos.service';
import { EditFormatoQrPosComponent } from './edit-formato-qr-pos/edit-formato-qr-pos.component';

/**
 * Listado de formatos de QR de POS.
 *
 * ⚠️ SIN PUERTA A PROPOSITO desde el 2026-09-16: no hay entrada de menu ni ningun otro camino
 * que abra este componente. La tabla `formato_qr_pos` es legacy; el parseo del cupon paso a
 * `formato_terminal_pos` (el ABM «Formatos de terminal POS» del menu «Gestion de POS»), y
 * ofrecer dos pantallas para el mismo concepto --con esta sin efecto sobre nada-- solo
 * confundia. El componente, el servicio y la tabla se conservan hasta el PR que los de de baja,
 * porque las filas son el respaldo de como estaba configurado cada formato. No es un huerfano
 * roto: es un huerfano deliberado.
 *
 * Un formato no se borra nunca: se desactiva. Borrarlo dejaria sin explicacion los
 * venta_tarjeta que ese formato ya completo.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-formato-qr-pos',
  templateUrl: './formato-qr-pos.component.html',
  styleUrls: ['./formato-qr-pos.component.scss'],
})
export class FormatoQrPosComponent implements OnInit {

  displayedColumns = ['id', 'nombre', 'proveedor', 'ejemplo', 'activo', 'acciones'];
  formatos: FormatoQrPos[] = [];
  cargando = false;

  constructor(
    private formatoQrPosService: FormatoQrPosService,
    private matDialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.formatoQrPosService.onGetTodos().pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.cargando = false;
        this.formatos = res || [];
      },
      error: () => (this.cargando = false),
    });
  }

  onNuevo(): void {
    this.abrir(null);
  }

  onEditar(formato: FormatoQrPos): void {
    this.abrir(formato);
  }

  private abrir(formato: FormatoQrPos): void {
    this.matDialog
      .open(EditFormatoQrPosComponent, { data: { formato }, width: '65vw' })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) this.cargar();
      });
  }

  onDesactivar(formato: FormatoQrPos): void {
    this.dialogosService
      .confirm(
        'Atención',
        `¿Desactivar el formato "${formato.nombre}"?`,
        'Los PDV van a dejar de reconocer ese cupón y las ventas con tarjeta habrá que registrarlas desde el celular.'
      )
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.formatoQrPosService.onDesactivar(formato.id).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.notificacionSnackbar.openSucess('Formato desactivado');
            this.cargar();
          },
        });
      });
  }
}
