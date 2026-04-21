import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { AdicionarPreGastoComponent } from '../adicionar-pre-gasto/adicionar-pre-gasto.component';
import { MatDialog } from '@angular/material/dialog';
import { WindowInfoService } from '../../../../../shared/services/window-info.service';
import { MainService } from '../../../../../main.service';
import { GastoService } from '../../service/gasto.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { AutorizarGastoDialogComponent } from '../../dialogs/autorizar-gasto-dialog/autorizar-gasto-dialog.component';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { switchMap, tap, map, shareReplay, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { FormControl, FormGroup } from '@angular/forms';
import { ReporteService } from '../../../../reportes/reporte.service';
import { ReportesComponent } from '../../../../reportes/reportes/reportes.component';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { CajaService } from '../../../pdv/caja/caja.service';

@UntilDestroy()
@Component({
  selector: 'app-list-pre-gastos',
  templateUrl: './list-pre-gastos.component.html',
  styleUrls: ['./list-pre-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPreGastosComponent {
  private gastoService = inject(GastoService);
  private windowInfoService = inject(WindowInfoService);
  private matDialog = inject(MatDialog);
  private tabService = inject(TabService);
  private mainService = inject(MainService);
  private reporteService = inject(ReporteService);
  private dialogosService = inject(DialogosService);
  private notificacionService = inject(NotificacionSnackbarService);
  private cajaService = inject(CajaService);

  alturaContenedor = this.windowInfoService.innerTabHeight;
  alturaTabla = this.windowInfoService.innerTabHeight * 0.72;

  tabEstados = ['PENDIENTE', 'TRAMITE', 'AUTORIZADO', 'ENVIADO_A_TESORERIA', 'RECHAZADO', null];
  tabEtiquetas = ['Pendientes', 'En Trámite', 'Autorizados', 'Enviados a Tesorería', 'Rechazados', 'Todos'];

  columnasVisibles = [
    'id', 'funcionario', 'tipoGasto', 'descripcion',
    'monto', 'moneda', 'sucursal', 'estado', 'fecha', 'acciones'
  ];

  private tabActivaSubject = new BehaviorSubject<number>(4); // Todos por defecto
  public tabActiva$ = this.tabActivaSubject.asObservable();

  private paginationSubject = new BehaviorSubject<{ pageIndex: number, pageSize: number }>({ pageIndex: 0, pageSize: 15 });
  public pagination$ = this.paginationSubject.asObservable();

  private refetchSubject = new BehaviorSubject<void>(void 0);

  public totalElements$ = new BehaviorSubject<number>(0);

  public cargandoSubject = new BehaviorSubject<boolean>(false);
  public cargando$ = this.cargandoSubject.asObservable();

  public preGastoSeleccionadoSubject = new BehaviorSubject<PreGasto | null>(null);
  public preGastoSeleccionado$ = this.preGastoSeleccionadoSubject.asObservable();
  fechaFormGroup = new FormGroup({
    inicio: new FormControl<Date | null>(ListPreGastosComponent.fechaInicioRangoPorDefecto()),
    fin: new FormControl<Date | null>(new Date()),
    buscarId: new FormControl<number | null>(null)
  });

  /** Rango por defecto: desde hace 3 días hasta hoy (inclusive). */
  private static fechaInicioRangoPorDefecto(): Date {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    inicio.setDate(inicio.getDate() - 3);
    return inicio;
  }

  public listaFiltrada$: Observable<PreGasto[]> = combineLatest([
    this.tabActiva$,
    this.refetchSubject,
    this.pagination$
  ]).pipe(
    tap(() => this.cargandoSubject.next(true)),
    switchMap(([tabIndex, _, pag]) => {
      const estado = this.tabEstados[tabIndex];
      const inicioStr = this.toDayBoundary(this.fechaFormGroup.controls.inicio.value, false);
      const finStr = this.toDayBoundary(this.fechaFormGroup.controls.fin.value, true);

      return this.gastoService.preGastoFilter(
        this.fechaFormGroup.controls.buscarId.value,
        undefined,
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

  onEnviarATesoreria(preGasto: PreGasto): void {
    if (!preGasto || !preGasto.id) return;

    this.cargandoSubject.next(true);
    this.gastoService.preGastoEnviarATesoreria(
      Number(preGasto.id),
      Number(preGasto.sucursalId),
      Number(this.mainService.usuarioActual?.id)
    ).subscribe({
      next: (res) => {
        this.cargandoSubject.next(false);
        if (res) {
          this.refetchSubject.next();
          this.preGastoSeleccionadoSubject.next(res);
        }
      },
      error: (err) => {
        this.cargandoSubject.next(false);
        console.error('Error al enviar a tesorería:', err);
      }
    });
  }

  onEnviarASucursalRetiro(preGasto: PreGasto): void {
    if (!preGasto?.id) return;

    this.dialogosService.confirm(
      'Confirmar envío',
      null,
      null,
      [`Solicitud #${preGasto.id}`, `Sucursal retiro: ${preGasto?.sucursalCaja?.nombre || 'Sin sucursal'}`]
    ).subscribe(confirmado => {
      if (!confirmado) return;
      this.notificacionService.openSucess('Solicitud enviada a sucursal de retiro');
      this.refetchSubject.next();
    });
  }

  onImprimirSolicitud(solicitudPagoId: number): void {
    this.cargandoSubject.next(true);
    this.gastoService.imprimirSolicitudPago(solicitudPagoId).subscribe({
      next: (res) => {
        this.cargandoSubject.next(false);
        if (res) {
          this.reporteService.onAdd(`Solicitud de Pago ${solicitudPagoId}`, res);
          this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, null));
        }
      },
      error: (err) => {
        this.cargandoSubject.next(false);
        console.error('Error al imprimir solicitud:', err);
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
      inicio: ListPreGastosComponent.fechaInicioRangoPorDefecto(),
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

  colorEstado(preGastoOrEstado: PreGasto | string): string {
    if (typeof preGastoOrEstado === 'string') {
      return '#9e9e9e';
    }
    return preGastoOrEstado?.estadoColor || '#9e9e9e';
  }

  iconoEstado(preGastoOrEstado: PreGasto | string): string {
    if (typeof preGastoOrEstado === 'string') {
      return 'help_outline';
    }
    return preGastoOrEstado?.estadoIcono || 'help_outline';
  }

  etiquetaEstado(preGastoOrEstado: PreGasto | string): string {
    if (typeof preGastoOrEstado === 'string') {
      return preGastoOrEstado;
    }
    return preGastoOrEstado?.estadoEtiqueta || preGastoOrEstado?.estado || '-';
  }

  private formatDate(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  private toDayBoundary(date: Date | null, endOfDay: boolean): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (endOfDay) {
      d.setHours(23, 59, 59, 0);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return this.formatDate(d);
  }
}
