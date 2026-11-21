import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ReportesRrhhService } from '../../reportes/reportes-rrhh.service';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
import { Aguinaldo } from '../aguinaldo.model';
import { AguinaldoService } from '../aguinaldo.service';
import { PagarAguinaldoDialogComponent } from '../pagar-aguinaldo-dialog/pagar-aguinaldo-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-aguinaldo',
  templateUrl: './list-aguinaldo.component.html',
  styleUrls: ['./list-aguinaldo.component.scss']
})
export class ListAguinaldoComponent implements OnInit {

  displayedColumns = ['funcionario', 'anio', 'mesesTrabajados', 'montoCalculado', 'montoProyectado', 'estado', 'acciones'];

  funcionarioControl = new FormControl(null);
  anioControl = new FormControl(null);

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<Aguinaldo>({
    cargar: (page, size) => this.aguinaldoService.onGetPage(
      page,
      size,
      this.anioControl.value,
      this.funcionarioControl.value
    ),
    pageSize: 25,
  });

  constructor(
    private aguinaldoService: AguinaldoService,
    public mainService: MainService,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    private dialog: MatDialog,
    private reportesRrhhService: ReportesRrhhService,
    private impresionService: ImpresionService
  ) { }

  puedeLiquidar = false;
  puedeAprobar = false;
  puedePagar = false;

  ngOnInit(): void {
    this.puedeLiquidar = this.mainService.tieneAlgunRol(['RRHH LIQUIDAR']);
    this.puedeAprobar = this.mainService.tieneAlgunRol(['RRHH APROBAR']);
    this.puedePagar = this.mainService.tieneAlgunRol(['RRHH PAGAR']);
    this.anioControl.setValue(new Date().getFullYear());
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
    this.anioControl.setValue(null);
    this.onFiltrar();
  }


  onCalcular() {
    if (this.anioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Ingrese el año', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.dialogosService.confirm(
      'Calcular aguinaldos',
      '¿Calcular los aguinaldos del año ' + this.anioControl.value + ' para todos los funcionarios activos?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        // El éxito lo avisa este componente (con la cantidad); el error, GenericCrudService.onSaveCustom.
        this.aguinaldoService.onCalcular(this.anioControl.value, true, { avisarExito: false })
          .pipe(untilDestroyed(this)).subscribe({
            next: (cant: number) => {
              this.notificacion.notification$.next({ texto: 'Aguinaldos calculados: ' + (cant ?? 0), color: NotificacionColor.success, duracion: 3 });
              this.buscar();
            },
            error: () => {}
          });
      }
    });
  }

  onAprobar(a: Aguinaldo) {
    this.aguinaldoService.onAprobar(a.id)
      .pipe(untilDestroyed(this))
      .subscribe({ next: res => { if (res != null) this.buscar(); }, error: () => {} });
  }

  /** Pago separado del aguinaldo: elige Caja Mayor y paga; luego ofrece el recibo. */
  onPagar(a: Aguinaldo) {
    this.dialog.open(PagarAguinaldoDialogComponent, {
      width: '420px',
      data: { aguinaldoId: a.id, nombre: a.funcionario?.persona?.nombre, monto: a.montoCalculado },
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.notificacion.notification$.next({ texto: 'Aguinaldo pagado', color: NotificacionColor.success, duracion: 3 });
        this.buscar();
        this.onVerRecibo(a);
      }
    });
  }

  onVerRecibo(a: Aguinaldo) {
    this.impresionService.imprimir('Recibo aguinaldo ' + a.id,
      (anchoMm, escpos) => this.reportesRrhhService.onReciboAguinaldo(a.id, anchoMm, escpos));
  }
}
