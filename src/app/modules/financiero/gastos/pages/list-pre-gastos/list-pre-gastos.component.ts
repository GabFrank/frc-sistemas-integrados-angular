import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { AdicionarPreGastoComponent } from '../adicionar-pre-gasto/adicionar-pre-gasto.component';
import { MatDialog } from '@angular/material/dialog';
import { WindowInfoService } from '../../../../../shared/services/window-info.service';
import { GastoService } from '../../service/gasto.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { AutorizarGastoDialogComponent } from '../../dialogs/autorizar-gasto-dialog/autorizar-gasto-dialog.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { switchMap, tap, map, shareReplay, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';

@UntilDestroy()
@Component({
  selector: 'app-list-pre-gastos',
  templateUrl: './list-pre-gastos.component.html',
  styleUrls: ['./list-pre-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPreGastosComponent implements OnInit {
  private gastoService = inject(GastoService);
  private windowInfoService = inject(WindowInfoService);
  private matDialog = inject(MatDialog);
  private tabService = inject(TabService);

  alturaContenedor = this.windowInfoService.innerTabHeight;
  alturaTabla = this.windowInfoService.innerTabHeight * 0.72;

  tabEstados = ['PENDIENTE', 'TRAMITE', 'AUTORIZADO', 'RECHAZADO', null];
  tabEtiquetas = ['Pendientes', 'En Trámite', 'Autorizados', 'Rechazados', 'Todos'];

  columnasVisibles = [
    'id', 'funcionario', 'tipoGasto', 'descripcion',
    'monto', 'moneda', 'sucursal', 'estado', 'fecha', 'acciones'
  ];

  // Tab activa
  private tabActivaSubject = new BehaviorSubject<number>(4); // Todos por defecto
  public tabActiva$ = this.tabActivaSubject.asObservable();

  // Paginación
  private paginationSubject = new BehaviorSubject<{ pageIndex: number, pageSize: number }>({ pageIndex: 0, pageSize: 15 });
  public pagination$ = this.paginationSubject.asObservable();

  private refetchSubject = new BehaviorSubject<void>(void 0);

  public totalElements$ = new BehaviorSubject<number>(0);

  public cargandoSubject = new BehaviorSubject<boolean>(false);
  public cargando$ = this.cargandoSubject.asObservable();

  public preGastoSeleccionadoSubject = new BehaviorSubject<PreGasto | null>(null);
  public preGastoSeleccionado$ = this.preGastoSeleccionadoSubject.asObservable();

  // Filtro de fechas con FormGroup para mat-date-range-picker
  fechaFormGroup = new FormGroup({
    inicio: new FormControl<Date | null>(new Date()),
    fin: new FormControl<Date | null>(new Date()),
    buscarId: new FormControl<number | null>(null)
  });

  public listaFiltrada$: Observable<PreGasto[]> = combineLatest([
    this.tabActiva$,
    this.refetchSubject,
    this.pagination$
  ]).pipe(
    tap(() => this.cargandoSubject.next(true)),
    switchMap(([tabIndex, _, pag]) => {
      const estado = this.tabEstados[tabIndex];
      let inicioStr = null;
      let finStr = null;
      if (this.fechaFormGroup.controls.inicio.value) {
        let date = this.fechaFormGroup.controls.inicio.value;
        inicioStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}T00:00:00`;
      }
      if (this.fechaFormGroup.controls.fin.value) {
        let date = this.fechaFormGroup.controls.fin.value;
        finStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}T23:59:59`;
      }

      return this.gastoService.preGastoFilter(
        this.fechaFormGroup.controls.buscarId.value,
        estado,
        inicioStr,
        finStr,
        pag.pageIndex,
        pag.pageSize
      ).pipe(
        catchError(err => {
          console.error('Error fetching pre_gastos:', err);
          return of(null);
        })
      );
    }),
    tap(res => {
      this.cargandoSubject.next(false);
      if (res) {
        this.totalElements$.next(res.getTotalElements || 0);
      }
    }),
    map(res => res?.getContent || []),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngOnInit(): void {
    // Initial fetch handled by subjects
  }

  cambiarTab(indice: number): void {
    this.tabActivaSubject.next(indice);
    this.preGastoSeleccionadoSubject.next(null);
    this.paginationSubject.next({ ...this.paginationSubject.value, pageIndex: 0 });
  }

  seleccionarPreGasto(preGasto: PreGasto): void {
    this.preGastoSeleccionadoSubject.next(preGasto);
  }

  autorizarGasto(preGasto: PreGasto): void {
    this.matDialog
      .open(AutorizarGastoDialogComponent, {
        data: { preGasto },
        width: '50%',
        disableClose: true,
        restoreFocus: true,
        autoFocus: true,
      })
      .afterClosed()
      .subscribe(res => {
        if (res != null) {
          this.refetchSubject.next();
          const actual = this.preGastoSeleccionadoSubject.value;
          if (actual?.id === preGasto.id) {
            this.preGastoSeleccionadoSubject.next(res);
          }
        }
      });
  }

  irAAgregarPreGasto(): void {
    this.tabService.addTab(new Tab(AdicionarPreGastoComponent, "Nuevo Pre-Gasto", null, ListPreGastosComponent));
  }

  onRefrescar(): void {
    this.refetchSubject.next();
  }

  onLimpiarFiltro(): void {
    this.fechaFormGroup.reset({
      inicio: new Date(),
      fin: new Date(),
      buscarId: null
    });
    this.onRefrescar();
  }

  onFiltrarFechas(): void {
    this.paginationSubject.next({ ...this.paginationSubject.value, pageIndex: 0 });
    this.refetchSubject.next();
  }

  handlePageEvent(e: PageEvent): void {
    this.paginationSubject.next({ pageIndex: e.pageIndex, pageSize: e.pageSize });
  }

  colorEstado(estado: string): string {
    const colores: Record<string, string> = {
      'PENDIENTE': '#ffa726',
      'TRAMITE': '#42a5f5',
      'AUTORIZADO': '#66bb6a',
      'RECHAZADO': '#ef5350',
      'COMPLETADO': '#78909c'
    };
    return colores[estado] || '#9e9e9e';
  }

  iconoEstado(estado: string): string {
    const iconos: Record<string, string> = {
      'PENDIENTE': 'hourglass_empty',
      'TRAMITE': 'swap_horiz',
      'AUTORIZADO': 'check_circle',
      'RECHAZADO': 'cancel',
      'COMPLETADO': 'task_alt'
    };
    return iconos[estado] || 'help_outline';
  }

  etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      'PENDIENTE': 'Pendiente',
      'TRAMITE': 'En Trámite',
      'AUTORIZADO': 'Autorizado',
      'RECHAZADO': 'Rechazado',
      'COMPLETADO': 'Completado'
    };
    return etiquetas[estado] || estado;
  }

  private getFechaHoyInicio(): string {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return this.formatDate(hoy);
  }

  private getFechaHoyFin(): string {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    return this.formatDate(hoy);
  }

  private formatDate(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}
