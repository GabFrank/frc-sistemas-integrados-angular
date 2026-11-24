import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { ReportesRrhhService } from '../../reportes/reportes-rrhh.service';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
import { Prestamo } from '../prestamo.model';
import { PrestamoService } from '../prestamo.service';
import { EditPrestamoDialogComponent } from '../edit-prestamo-dialog/edit-prestamo-dialog.component';
import { PrestamoCuotasDialogComponent } from '../prestamo-cuotas-dialog/prestamo-cuotas-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-prestamo',
  templateUrl: './list-prestamo.component.html',
  styleUrls: ['./list-prestamo.component.scss']
})
export class ListPrestamoComponent implements OnInit {

  displayedColumns = ['fechaInicio', 'funcionario', 'descripcion', 'montoTotal', 'montoPagado', 'cantidadCuotas', 'estado', 'acciones'];

  funcionarioControl = new FormControl(null);
  estadoControl = new FormControl(null);

  estadoOpciones = ['ACTIVO', 'PAGADO', 'CANCELADO'];

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<Prestamo>({
    cargar: (page, size) => this.prestamoService.onGetPage(
      page,
      size,
      this.funcionarioControl.value,
      this.estadoControl.value
    ),
    pageSize: 25,
  });

  constructor(
    private prestamoService: PrestamoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private reportesRrhhService: ReportesRrhhService,
    private impresionService: ImpresionService
  ) { }

  onVerRecibo(row: Prestamo) {
    this.impresionService.imprimir('Recibo préstamo ' + row.id,
      (anchoMm, escpos) => this.reportesRrhhService.onReciboPrestamo(row.id, anchoMm, escpos));
  }

  ngOnInit(): void {
    this.buscar();
  }

  // Un filtro nuevo arranca en la página 1: la página actual puede no existir en el resultado filtrado.
  onFiltrar() {
    this.pag.filtrar();
  }

  /** Repite la página a la vista (al abrir, tras guardar o borrar). */
  buscar() {
    this.pag.recargar();
  }

  onResetFiltro() {
    this.funcionarioControl.setValue(null);
    this.estadoControl.setValue(null);
    this.onFiltrar();
  }


  onNuevo() {
    this.dialog.open(EditPrestamoDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '560px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.buscar(); });
  }

  onVerCuotas(prestamo: Prestamo) {
    this.dialog.open(PrestamoCuotasDialogComponent, { data: { prestamo }, width: '640px', disableClose: false })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(() => { this.buscar(); });
  }
}
