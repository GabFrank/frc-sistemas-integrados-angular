import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntradaVaria } from '../entrada-varia.model';
import { EntradaVariaService } from '../entrada-varia.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { PageInfo } from '../../../../app.component';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-entradas-varias-dialog',
  templateUrl: './list-entradas-varias-dialog.component.html',
  styleUrls: ['./list-entradas-varias-dialog.component.scss']
})
export class ListEntradasVariasDialogComponent implements OnInit {

  dataSource = new MatTableDataSource<EntradaVaria>([]);
  isSearching = false;
  pageIndex = 0;
  pageSize = 10;
  selectedPageInfo: PageInfo<EntradaVaria>;

  puedeGestionar = false;

  /** Lo lee quien abrió el diálogo al cerrarse (no hay botón de cierre: se sale con Esc o clic afuera). */
  huboCambios = false;

  displayedColumns = [
    'creadoEn',
    'esIngreso',
    'categoria',
    'monto',
    'formaPago',
    'descripcion',
    'anulado',
    'acciones'
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public cajaVirtual: CajaVirtual,
    private entradaVariaService: EntradaVariaService,
    private notificacion: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    this.onFiltrar();
  }

  onFiltrar() {
    if (!this.cajaVirtual?.id) return;
    this.isSearching = true;
    this.entradaVariaService.onGetEntradasVarias(this.cajaVirtual.id, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSearching = false;
          if (res == null) { this.notificacion.openWarn('No se pudieron cargar las entradas varias.', 5); return; }
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent;
        },
        error: () => {
          this.isSearching = false;
          this.notificacion.openWarn('No se pudieron cargar las entradas varias: el servidor no responde.', 5);
        }
      });
  }

  onAnular(item: EntradaVaria) {
    this.dialogosService.confirm(
      'Anular Movimiento',
      `¿Está seguro que desea anular este movimiento de ${item.monto}?`,
      null, null
    ).subscribe(confirmed => {
      if (confirmed) {
        // Antes de enviar: si el diálogo se cierra a mitad de camino, la caja igual se relee.
        this.huboCambios = true;
        // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
        this.entradaVariaService.onAnular(item.id, 'ANULADO DESDE ESCRITORIO', { avisarExito: false })
          .pipe(untilDestroyed(this))
          .subscribe({
            next: res => {
              if (res != null) {
                this.notificacion.openSucess('Movimiento anulado correctamente');
              } else {
                this.notificacion.openWarn('No se pudo confirmar la anulación: se vuelve a leer para verificarla.', 6);
              }
              this.onFiltrar();
            },
            // Rechazo («ya está anulada»: la lista estaba vieja) o sin respuesta (pudo haberse
            // aplicado): en los dos casos hay que releer antes de ofrecer otra vez la acción (#390).
            error: () => this.onFiltrar()
          });
      }
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }
}
