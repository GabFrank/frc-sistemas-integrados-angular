import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntradaVaria } from '../entrada-varia.model';
import { EntradaVariaService } from '../entrada-varia.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
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
  /** Entradas varias de la caja, paginadas en el central (#772): si una página falla, vuelve a la anterior. */
  pag: PaginacionLista<EntradaVaria> = new PaginacionLista<EntradaVaria>({
    cargar: (page, size) => this.entradaVariaService.onGetEntradasVarias(this.cajaVirtual.id, page, size).pipe(
      tap(res => {
        if (res == null) this.notificacion.openWarn('No se pudieron cargar las entradas varias.', 5);
      }),
      catchError(() => {
        this.notificacion.openWarn('No se pudieron cargar las entradas varias: el servidor no responde.', 5);
        return of(null);
      })
    ),
    pageSize: 10,
    pageSizeOptions: [10, 20, 50],
    alCargar: (res) => this.dataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.dataSource.data = [];
    },
  });

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
    this.pag.filtrar();
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
              this.pag.recargar();
            },
            // Rechazo («ya está anulada»: la lista estaba vieja) o sin respuesta (pudo haberse
            // aplicado): en los dos casos hay que releer antes de ofrecer otra vez la acción (#390).
            error: () => this.pag.recargar()
          });
      }
    });
  }
}
