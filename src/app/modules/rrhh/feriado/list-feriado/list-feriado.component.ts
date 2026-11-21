import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Feriado } from '../feriado.model';
import { FeriadoService } from '../feriado.service';
import { EditFeriadoDialogComponent } from '../edit-feriado-dialog/edit-feriado-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-feriado',
  templateUrl: './list-feriado.component.html',
  styleUrls: ['./list-feriado.component.scss']
})
export class ListFeriadoComponent implements OnInit {

  displayedColumns = ['fecha', 'descripcion', 'esNacional', 'recargoPorcentaje', 'activo', 'acciones'];

  descripcionControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);
  activoControl = new FormControl(null);

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<Feriado>({
    cargar: (page, size) => this.feriadoService.onGetPage(
      page,
      size,
      dateToString(this.desdeControl.value, 'yyyy-MM-dd'),
      dateToString(this.hastaControl.value, 'yyyy-MM-dd'),
      this.descripcionControl.value,
      this.activoControl.value
    ),
    pageSize: 25,
  });

  constructor(
    private feriadoService: FeriadoService,
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
    this.desdeControl.setValue(null);
    this.hastaControl.setValue(null);
    this.activoControl.setValue(null);
    this.onFiltrar();
  }


  onNuevo() {
    this.dialog.open(EditFeriadoDialogComponent, { width: '460px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) this.buscar();
      });
  }

  onEditar(feriado: Feriado) {
    this.dialog.open(EditFeriadoDialogComponent, { data: { feriado }, width: '460px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) this.buscar();
      });
  }

  onEliminar(feriado: Feriado) {
    this.dialogosService.confirm(
      'Eliminar feriado',
      '¿Desea eliminar el feriado ' + feriado.descripcion + '?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.feriadoService.onDelete(feriado.id)
          .pipe(untilDestroyed(this))
          .subscribe(ok => { if (ok) this.buscar(); });
      }
    });
  }
}
