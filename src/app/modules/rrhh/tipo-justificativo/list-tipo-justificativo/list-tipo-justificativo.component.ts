import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
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

  displayedColumns = ['nombre', 'descripcion', 'evitaPenalizacion', 'descuentaSalario', 'requiereDocumento', 'origen', 'activo', 'acciones'];

  nombreControl = new FormControl(null);
  /** tri-state: null=Todos, true=Activos, false=Inactivos */
  activoControl = new FormControl(null);

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<TipoJustificativo>({
    cargar: (page, size) => this.service.onGetTiposPage(
      page,
      size,
      this.nombreControl.value ? this.nombreControl.value.trim() : null,
      this.activoControl.value
    ),
    pageSize: 25,
  });

  constructor(
    private service: JustificativoService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

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
    this.nombreControl.setValue(null);
    this.activoControl.setValue(null);
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
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.buscar(); });
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
          .subscribe(ok => { if (ok) this.buscar(); });
      }
    });
  }
}
