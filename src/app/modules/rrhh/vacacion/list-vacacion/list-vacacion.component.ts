import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { map } from 'rxjs/operators';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { Vacacion } from '../vacacion.model';
import { VacacionService } from '../vacacion.service';
import { GestionVacacionDialogComponent } from '../gestion-vacacion-dialog/gestion-vacacion-dialog.component';

interface VacacionRow extends Vacacion { disponibles: number; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-vacacion',
  templateUrl: './list-vacacion.component.html',
  styleUrls: ['./list-vacacion.component.scss']
})
export class ListVacacionComponent implements OnInit {

  displayedColumns = ['anioServicio', 'funcionario', 'diasGenerados', 'diasGozados', 'disponibles', 'prescrita', 'acciones'];

  funcionarioControl = new FormControl(null);
  anioControl = new FormControl(null);

  /** Paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<VacacionRow>({
    cargar: (page, size) => this.vacacionService.onGetPage(
      page,
      size,
      this.funcionarioControl.value,
      this.anioControl.value
    ).pipe(
      map(res => res && { getTotalElements: res.getTotalElements, getContent: (res.getContent || []).map(v => ({
        ...v,
        disponibles: (v.diasGenerados || 0) - (v.diasGozados || 0)
      })) })
    ),
    pageSize: 25,
  });

  constructor(
    private vacacionService: VacacionService,
    public mainService: MainService,
    private dialog: MatDialog,
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
    this.funcionarioControl.setValue(null);
    this.anioControl.setValue(null);
    this.onFiltrar();
  }


  onDevengar() {
    if (this.funcionarioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione un funcionario', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
    this.vacacionService.onDevengar(this.funcionarioControl.value)
      .pipe(untilDestroyed(this))
      .subscribe({ next: res => { if (res != null) this.buscar(); }, error: () => {} });
  }

  onGestionar(vacacion: Vacacion) {
    this.dialog.open(GestionVacacionDialogComponent, { data: { vacacion }, width: '760px', disableClose: false })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(() => { this.buscar(); });
  }
}
