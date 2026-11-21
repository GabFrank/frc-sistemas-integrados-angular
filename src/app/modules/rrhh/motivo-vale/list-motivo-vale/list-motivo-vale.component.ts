import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { MotivoVale } from '../motivo-vale.model';
import { MotivoValeService } from '../motivo-vale.service';
import { EditMotivoValeDialogComponent } from '../edit-motivo-vale-dialog/edit-motivo-vale-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-motivo-vale',
  templateUrl: './list-motivo-vale.component.html',
  styleUrls: ['./list-motivo-vale.component.scss']
})
export class ListMotivoValeComponent implements OnInit {

  displayedColumns = ['nombre', 'descripcion', 'activo', 'acciones'];

  descripcionControl = new FormControl(null);
  activoControl = new FormControl(null);

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<MotivoVale>({
    cargar: (page, size) => this.motivoValeService.onGetPage(
      page,
      size,
      this.descripcionControl.value,
      this.activoControl.value
    ),
    pageSize: 25,
  });

  constructor(
    private motivoValeService: MotivoValeService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
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
    this.descripcionControl.setValue(null);
    this.activoControl.setValue(null);
    this.onFiltrar();
  }


  onNuevo() {
    this.dialog.open(EditMotivoValeDialogComponent, { width: '440px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.buscar(); });
  }

  onEditar(motivo: MotivoVale) {
    this.dialog.open(EditMotivoValeDialogComponent, { data: { motivo }, width: '440px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.buscar(); });
  }

  onEliminar(motivo: MotivoVale) {
    this.dialogosService.confirm(
      'Eliminar motivo', '¿Desea eliminar el motivo ' + motivo.nombre + '?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.motivoValeService.onDelete(motivo.id)
          .pipe(untilDestroyed(this)).subscribe(ok => { if (ok) this.buscar(); });
      }
    });
  }
}
