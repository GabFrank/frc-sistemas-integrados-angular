import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { HoraExtra, HoraExtraTipo } from '../hora-extra.model';
import { HoraExtraService } from '../hora-extra.service';
import { EditHoraExtraDialogComponent } from '../edit-hora-extra-dialog/edit-hora-extra-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-hora-extra',
  templateUrl: './list-hora-extra.component.html',
  styleUrls: ['./list-hora-extra.component.scss']
})
export class ListHoraExtraComponent implements OnInit {

  displayedColumns = ['fecha', 'funcionario', 'tipo', 'minutos', 'recargoPorcentaje', 'montoCalculado', 'origen', 'estado', 'acciones'];

  funcionarioControl = new FormControl(null);
  tipoControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);

  tipoOpciones: HoraExtraTipo[] = ['DIURNA', 'NOCTURNA', 'FERIADO'];

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<HoraExtra>({
    cargar: (page, size) => this.horaExtraService.onGetPage(
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
    private horaExtraService: HoraExtraService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    const hoy = new Date();
    this.desdeControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hastaControl.setValue(hoy);
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


  onNueva() {
    this.dialog.open(EditHoraExtraDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '560px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.buscar();
    });
  }

  onAnular(he: HoraExtra) {
    this.dialogosService.confirm(
      'Anular hora extra',
      '¿Desea anular esta hora extra?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
        this.horaExtraService.onAnular(he.id)
          .pipe(untilDestroyed(this))
          .subscribe({ next: ok => { if (ok) this.buscar(); }, error: () => {} });
      }
    });
  }
}
