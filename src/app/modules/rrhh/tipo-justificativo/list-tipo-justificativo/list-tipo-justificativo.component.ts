import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { TipoJustificativo } from '../../justificativo/justificativo.model';
import { JustificativoService } from '../../justificativo/justificativo.service';
import { EditTipoJustificativoDialogComponent } from '../edit-tipo-justificativo-dialog/edit-tipo-justificativo-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-tipo-justificativo',
  templateUrl: './list-tipo-justificativo.component.html',
  styleUrls: ['./list-tipo-justificativo.component.scss']
})
export class ListTipoJustificativoComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['nombre', 'descripcion', 'evitaPenalizacion', 'descuentaSalario', 'requiereDocumento', 'origen', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<TipoJustificativo>([]);

  nombreControl = new FormControl(null);
  /** tri-state: null=Todos, true=Activos, false=Inactivos */
  activoControl = new FormControl(null);

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<TipoJustificativo>;

  constructor(
    private service: JustificativoService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    this.service.onGetTiposPage(
      this.pageIndex,
      this.pageSize,
      this.nombreControl.value ? this.nombreControl.value.trim() : null,
      this.activoControl.value
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent || [];
      }
    });
  }

  onResetFiltro() {
    this.nombreControl.setValue(null);
    this.activoControl.setValue(null);
    this.pageIndex = 0;
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onNuevo() {
    this.abrir(null);
  }

  onEditar(t: TipoJustificativo) {
    this.abrir(t);
  }

  private abrir(tipo: TipoJustificativo) {
    this.dialog.open(EditTipoJustificativoDialogComponent, {
      data: { tipo }, width: '560px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onEliminar(t: TipoJustificativo) {
    if (t.generadoPorSistema) {
      this.notificacion.notification$.next({
        texto: 'No se puede eliminar un tipo generado por el sistema',
        color: NotificacionColor.warn, duracion: 3
      });
      return;
    }
    this.dialogosService.confirm(
      'Eliminar tipo', '¿Desea eliminar el tipo ' + (t.nombre || '') + '?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.service.onDeleteTipo(t.id).pipe(untilDestroyed(this))
          .subscribe(ok => { if (ok) this.onFiltrar(); });
      }
    });
  }
}
