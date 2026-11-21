import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WindowInfoService } from '../../../../../shared/services/window-info.service';
import { GastoService } from '../../service/gasto.service';
import { TipoGasto } from '../../models/tipo-gasto.model';
import { AdicionarTipoGastoDialogComponent } from '../../dialogs/adicionar-tipo-gasto-dialog/adicionar-tipo-gasto-dialog.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, map, shareReplay, catchError, take } from 'rxjs/operators';
import { PaginacionLista } from '../../../../../shared/components/paginacion/paginacion-lista';
import { FormControl, FormGroup } from '@angular/forms';
import { ModuloGastoService } from '../../service/modulo-gasto.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../../../shared/services/timeout-link';
import { etiquetaModuloPadre, ModuloGastoInfo } from '../../utils/tipo-gasto-modulo-reglas.util';

type TipoGastoVista = TipoGasto & { moduloPadreEtiqueta: string };

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-tipo-gastos',
  templateUrl: './list-tipo-gastos.component.html',
  styleUrls: ['./list-tipo-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListTipoGastosComponent implements OnInit {
  private gastoService = inject(GastoService);
  private moduloGastoService = inject(ModuloGastoService);
  private notificacionAviso = inject(NotificacionSnackbarService);
  private windowInfoService = inject(WindowInfoService);
  private matDialog = inject(MatDialog);

  alturaContenedor = this.windowInfoService.innerTabHeight;
  alturaTabla = this.windowInfoService.innerTabHeight * 0.72;

  tabNaturalezas = [null, 'CONTINUO', 'RECURRENTE', 'VARIABLE'];
  tabEtiquetas = ['Todos', 'Continuos', 'Recurrentes', 'Variables'];
  modulosPadreOpciones: ModuloGastoInfo[] = [];

  coloresNaturaleza: Record<string, string> = {
    CONTINUO: '#42a5f5',
    RECURRENTE: '#ffa726',
    VARIABLE: '#66bb6a',
  };

  columnasVisibles = [
    'id', 'descripcion', 'tipoNaturaleza', 'moduloPadre', 'comportamiento', 'autorizacion', 'activo', 'activoEnSucursales', 'acciones'
  ];

  // Sin catálogo la lista de tipos sigue viva (sin etiqueta de módulo): antes un error del catálogo, que entraba al
  // combineLatest por fuera del switchMap, mataba la lista (#390). Ahora se lee una vez por página.
  private catalogoModulos$ = this.moduloGastoService.obtenerModulos().pipe(
    catchError(() => {
      this.notificacionAviso.openWarn('No se pudo cargar el catálogo de módulos de gasto.', 5);
      return of([] as ModuloGastoInfo[]);
    }),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  private tabActivaSubject = new BehaviorSubject<number>(0);
  public tabActiva$ = this.tabActivaSubject.asObservable();

  searchFormGroup = new FormGroup({
    texto: new FormControl<string | null>(''),
    moduloPadre: new FormControl<string | null>(null),
  });

  /** Tipos de gasto de la pestaña activa, paginados en el central (#772). */
  pag: PaginacionLista<TipoGastoVista> = new PaginacionLista<TipoGastoVista>({
    cargar: (page, size) => this.catalogoModulos$.pipe(
      take(1),
      switchMap(catalogo => this.gastoService.tipoGastoFilter(
        this.tabNaturalezas[this.tabActivaSubject.value],
        this.searchFormGroup.controls.texto.value || null,
        page,
        size,
        this.searchFormGroup.controls.moduloPadre.value || null,
        PROPAGAR_ERROR_DE_RED,
        { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }
      ).pipe(
        map(res => {
          if (res == null) {
            this.notificacionAviso.openWarn('No se pudieron cargar los tipos de gasto.', 5);
            return null;
          }
          return {
            getTotalElements: res.getTotalElements,
            getContent: (res.getContent || []).map(item => ({
              ...item,
              moduloPadreEtiqueta: etiquetaModuloPadre(catalogo, item.moduloPadre),
            })),
          };
        }),
        catchError(err => {
          console.error('Error fetching tipo_gastos:', err);
          this.notificacionAviso.openWarn('No se pudieron cargar los tipos de gasto: el servidor no responde.', 5);
          return of(null);
        })
      ))
    ),
    pageSize: 15,
    pageSizeOptions: [15, 30, 50, 100],
  });

  ngOnInit(): void {
    this.catalogoModulos$.pipe(untilDestroyed(this)).subscribe(modulos => {
      this.modulosPadreOpciones = modulos;
    });
    this.pag.filtrar();
  }

  cambiarTab(indice: number): void {
    this.tabActivaSubject.next(indice);
    this.pag.filtrar();
  }

  onBuscar(): void {
    this.pag.filtrar();
  }

  onLimpiar(): void {
    this.searchFormGroup.reset();
    this.tabActivaSubject.next(0);
    this.pag.filtrar();
  }

  agregarNuevo(): void {
    this.matDialog
      .open(AdicionarTipoGastoDialogComponent, {
        data: {},
        width: '50%',
        disableClose: true,
        restoreFocus: true,
        autoFocus: true,
      })
      .afterClosed()
      .subscribe(res => {
        if (res != null) {
          this.pag.recargar();
        }
      });
  }

  editarItem(tipoGasto: TipoGasto): void {
    this.matDialog
      .open(AdicionarTipoGastoDialogComponent, {
        data: {
          tipoGasto: tipoGasto,
        },
        width: '50%',
        disableClose: true,
        restoreFocus: true,
        autoFocus: true,
      })
      .afterClosed()
      .subscribe(res => {
        if (res != null) {
          this.pag.recargar();
        }
      });
  }

  eliminarItem(tipoGasto: TipoGasto): void {
    this.gastoService.tipoGastoOnDelete(tipoGasto.id)
      .subscribe(res => {
        if (res) {
          this.pag.recargar();
        }
      });
  }

  esTabActiva(indice: number, tabActiva: number | null): boolean {
    return tabActiva === indice;
  }
}
