import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Justificativo, TipoJustificativo } from '../justificativo.model';
import { JustificativoService } from '../justificativo.service';
import { EditJustificativoDialogComponent } from '../edit-justificativo-dialog/edit-justificativo-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-justificativo',
  templateUrl: './list-justificativo.component.html',
  styleUrls: ['./list-justificativo.component.scss']
})
export class ListJustificativoComponent implements OnInit {

  displayedColumns = ['fecha', 'funcionario', 'tipo', 'observacion', 'registradoPor', 'acciones'];

  tipoOptions: TipoJustificativo[] = [];

  funcionarioControl = new FormControl(null);
  tipoControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<Justificativo>({
    cargar: (page, size) => this.justificativoService.onGetPage(
      page,
      size,
      this.funcionarioControl.value,
      dateToString(this.desdeControl.value, 'yyyy-MM-dd'),
      dateToString(this.hastaControl.value, 'yyyy-MM-dd'),
      this.tipoControl.value
    ),
    pageSize: 25,
  });

  constructor(
    private justificativoService: JustificativoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.inicializarFechasMesActual();
    this.justificativoService.onGetTiposActivos().pipe(untilDestroyed(this))
      .subscribe((res: TipoJustificativo[]) => { this.tipoOptions = res || []; });
    this.buscar();
  }

  private inicializarFechasMesActual() {
    const hoy = new Date();
    this.desdeControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hastaControl.setValue(hoy);
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
    this.inicializarFechasMesActual();
    this.onFiltrar();
  }


  onNueva() {
    this.dialog.open(EditJustificativoDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.buscar();
    });
  }

  onEditar(n: Justificativo) {
    this.dialog.open(EditJustificativoDialogComponent, {
      data: { funcionarioId: n.funcionario?.id, justificativo: n },
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.buscar();
    });
  }

  onEliminar(n: Justificativo) {
    this.dialogosService.confirm(
      'Eliminar justificativo',
      '¿Desea eliminar este justificativo?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.justificativoService.onDelete(n.id)
          .pipe(untilDestroyed(this))
          .subscribe(ok => { if (ok) this.buscar(); });
      }
    });
  }
}
