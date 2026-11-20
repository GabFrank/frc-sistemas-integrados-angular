import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ReportesRrhhService } from '../../reportes/reportes-rrhh.service';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
import { Bono, BonoTipo } from '../bono.model';
import { BonoService } from '../bono.service';
import { EditBonoDialogComponent } from '../edit-bono-dialog/edit-bono-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-bono',
  templateUrl: './list-bono.component.html',
  styleUrls: ['./list-bono.component.scss']
})
export class ListBonoComponent implements OnInit {

  displayedColumns = ['fecha', 'funcionario', 'tipo', 'monto', 'motivo', 'recurrente', 'estado', 'acciones'];

  funcionarioControl = new FormControl(null);
  tipoControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);

  tipoOpciones: BonoTipo[] = ['CUMPLEANIOS', 'NAVIDAD', 'DESEMPENIO', 'PRODUCTIVIDAD', 'OTRO'];

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<Bono>({
    cargar: (page, size) => this.bonoService.onGetPage(
      page,
      size,
      this.funcionarioControl.value,
      this.tipoControl.value,
      dateToString(this.desdeControl.value, 'yyyy-MM-dd'),
      dateToString(this.hastaControl.value, 'yyyy-MM-dd')
    ),
    pageSize: 25,
  });

  constructor(
    private bonoService: BonoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    private reportesRrhhService: ReportesRrhhService,
    private impresionService: ImpresionService
  ) { }

  onVerRecibo(row: Bono) {
    this.impresionService.imprimir('Recibo bono ' + row.id,
      (anchoMm, escpos) => this.reportesRrhhService.onReciboBono(row.id, anchoMm, escpos));
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
    this.tipoControl.setValue(null);
    this.desdeControl.setValue(null);
    this.hastaControl.setValue(null);
    this.onFiltrar();
  }


  onNuevo() {
    this.dialog.open(EditBonoDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value, bono: null },
      width: '520px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.buscar(); });
  }

  onEditar(row: Bono) {
    this.dialog.open(EditBonoDialogComponent, {
      data: { funcionarioId: null, bono: row },
      width: '520px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.buscar(); });
  }

  onAnular(bono: Bono) {
    this.dialogosService.confirm(
      'Anular bono', '¿Desea anular este bono?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
        this.bonoService.onAnular(bono.id).pipe(untilDestroyed(this))
          .subscribe({ next: ok => { if (ok) this.buscar(); }, error: () => {} });
      }
    });
  }
}
