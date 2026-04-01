import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EnteService } from '../../service/ente.service';
import { Ente } from '../../models/ente.model';
import { MainService } from '../../../../../main.service';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { MatDialog } from '@angular/material/dialog';
import { EnteSucursalDialogComponent } from '../../dialogs/ente-sucursal-dialog/ente-sucursal-dialog.component';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../../notificacion-snackbar.service';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import { catchError, filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { TipoEnte } from '../../enums/tipo-ente.enum';
import { MuebleService } from '../../../muebles/service/mueble.service';
import { InmuebleService } from '../../../inmueble/service/inmueble.service';
import { VehiculoService } from '../../../vehiculos/vehiculo/service/vehiculo.service';
import { Mueble } from '../../../muebles/models/mueble.model';
import { Inmueble } from '../../../inmueble/models/inmueble.model';
import { Vehiculo } from '../../../vehiculos/vehiculo/models/vehiculo.model';
import { EnteSucursalInput } from '../../models/ente-sucursal-input.model';
import { EnteSucursal } from '../../models/ente-sucursal.model';

interface BienFinancieroRow {
  id?: number;
  tipoEnte?: TipoEnte;
  referenciaId?: number;
  activo?: boolean;
  descripcion: string;
  sucursal: string;
  situacionPago: string;
  cuotasPagadas: number;
  cuotasTotales: number;
  cuotasFaltantes: number;
  montoTotal: number;
  montoYaPagado: number;
  montoPendiente: number;
  moneda: string;
  diaVencimiento: number;
  diasParaVencer: number;
  estadoCuota: 'PAGADO' | 'AL DIA' | 'POR VENCER' | 'VENCIDO' | 'SIN PLAN';
  estadoCuotaClass: string;
  proveedor: string;
  detalleGastos: { concepto: string; monto: number; moneda: string }[];
  sucursalIds: number[];
}

interface DashboardResumen {
  totalBienes: number;
  pagados: number;
  enPago: number;
  cuotasFaltantes: number;
  totalGastado: number;
  totalComprometido: number;
  totalPendiente: number;
}

@UntilDestroy()
@Component({
  selector: 'app-list-bienes-sucursal',
  templateUrl: './list-bienes-sucursal.component.html',
  styleUrls: ['./list-bienes-sucursal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class ListBienesSucursalComponent implements OnInit {
  public enteService = inject(EnteService);
  private cdr = inject(ChangeDetectorRef);
  public mainService = inject(MainService);
  public sucursalService = inject(SucursalService);
  private matDialog = inject(MatDialog);
  private notificationService = inject(NotificacionSnackbarService);
  private muebleService = inject(MuebleService); // Inyectamos el servicio de muebles
  private inmuebleService = inject(InmuebleService);
  private vehiculoService = inject(VehiculoService);

  sucursalControl = new FormControl<number | null>(null);
  tipoControl = new FormControl<TipoEnte | null>(null);
  estadoPagoControl = new FormControl<string | null>(null);
  estadoCuotaControl = new FormControl<string | null>(null);

  public allRows$ = this.enteService.entes$.pipe(
    switchMap(entes => {
      if (!entes?.length) return of([]);
      return forkJoin(entes.map(ente => this.armarFila(ente)));
    }),
    tap(rows => {
      this.tiposDisponibles = Array.from(new Set(rows.map(r => r.tipoEnte).filter((v): v is TipoEnte => !!v)));
      this.estadosPagoDisponibles = Array.from(new Set(rows.map(r => r.situacionPago).filter(Boolean)));
      this.monedaPrincipal = this.detectarMonedaPrincipal(rows);
    }),
    shareReplay(1)
  );

  public filteredRows$ = combineLatest([
    this.allRows$,
    this.sucursalControl.valueChanges.pipe(startWith(this.sucursalControl.value)),
    this.tipoControl.valueChanges.pipe(startWith(this.tipoControl.value)),
    this.estadoPagoControl.valueChanges.pipe(startWith(this.estadoPagoControl.value)),
    this.estadoCuotaControl.valueChanges.pipe(startWith(this.estadoCuotaControl.value))
  ]).pipe(
    map(([rows, sucursalId, tipo, estadoPago, estadoCuota]) => {
      return (rows || []).filter(row =>
        (!sucursalId || row.sucursalIds.includes(sucursalId) || row.sucursalIds.length === 0) &&
        (!tipo || row.tipoEnte === tipo) &&
        (!estadoPago || row.situacionPago === estadoPago) &&
        (!estadoCuota || row.estadoCuota === estadoCuota)
      );
    }),
    tap(() => {
      this.expandedRow = null;
    }),
    shareReplay(1)
  );

  public resumen$ = this.filteredRows$.pipe(
    map(rows => this.crearResumen(rows || []))
  );

  expandedRow: BienFinancieroRow | null = null;

  displayedColumns: string[] = [
    'id',
    'tipoEnte',
    'descripcion',
    'sucursal',
    'situacionPago',
    'cuotas',
    'montoYaPagado',
    'montoPendiente',
    'activo',
    'acciones'
  ];

  sucursales: Sucursal[] = [];
  tiposDisponibles: TipoEnte[] = [];
  estadosPagoDisponibles: string[] = [];
  estadosCuotaDisponibles: string[] = ['PAGADO', 'AL DIA', 'POR VENCER', 'VENCIDO', 'SIN PLAN'];
  monedaPrincipal = 'Gs.';

  ngOnInit(): void {
    this.sucursalControl.setValue(null);
    this.enteService.setSucursalId(null);
    this.enteService.setSearchText('');

    this.sucursalService.onGetAllSucursales().subscribe(res => {
      this.sucursales = res || [];
      this.cdr.markForCheck();
    });

    this.enteService.refrescar();
  }

  onAdicionar(): void {
    const sucursalId = this.sucursalControl.value;

    this.matDialog.open(EnteSucursalDialogComponent, {
      data: {
        sucursalId
      },
      width: '600px'
    }).afterClosed().pipe(
      filter(res => !!res)
    ).subscribe(() => {
      this.enteService.refrescar();
    });
  }

  onEditar(row: BienFinancieroRow): void {
    if (!row.id) return;
    const sucursalId = this.sucursalControl.value;

    const obs = sucursalId
      ? this.enteService.getEnteSucursalByEnteAndSucursal(row.id, sucursalId)
      : this.enteService.getEnteSucursalByEnteId(row.id).pipe(map(res => (res as EnteSucursal[])[0] || null));

    obs.pipe(untilDestroyed(this)).subscribe(enteSucursal => {
      if (enteSucursal) {
        this.matDialog.open(EnteSucursalDialogComponent, {
          data: {
            enteSucursal
          },
          width: '600px'
        }).afterClosed().pipe(filter(res => !!res)).subscribe(() => {
          this.enteService.refrescar();
        });
      } else {
        this.enteService.onBuscarPorId(row.id!).subscribe(ente => {
          if (ente) {
             this.matDialog.open(EnteSucursalDialogComponent, {
              data: {
                ente,
                sucursalId
              },
              width: '600px'
            }).afterClosed().pipe(filter(res => !!res)).subscribe(() => {
              this.enteService.refrescar();
            });
          }
        });
      }
    });
  }

  onRetirarDeSucursal(ente: BienFinancieroRow): void {
    const sucursalId = this.sucursalControl.value;
    if (!sucursalId || !ente?.id) return;

    this.enteService.getEnteSucursalByEnteAndSucursal(ente.id, sucursalId).subscribe(res => {
      if (res) {
        this.enteService.onEliminarEnteSucursal(res.id).subscribe(deleted => {
          if (deleted) {
            this.notificationService.notification$.next({
              texto: 'Bien retirado de la sucursal',
              color: NotificacionColor.info,
              duracion: 2
            });
            this.enteService.refrescar();
          }
        });
      }
    });
  }

  onSolicitarPago(row: BienFinancieroRow): void {
    this.notificationService.notification$.next({
      texto: `Solicitud de pago iniciada para: ${row.descripcion}`,
      color: NotificacionColor.info,
      duracion: 2
    });
  }

  onFiltrar(): void {
    this.enteService.refrescar();
  }

  handlePageEvent(event: PageEvent): void {
    this.enteService.updatePagination(event.pageIndex, event.pageSize);
  }

  resetFiltro(): void {
    this.enteService.setSearchText('');
    this.tipoControl.setValue(null);
    this.estadoPagoControl.setValue(null);
    this.estadoCuotaControl.setValue(null);
    this.enteService.refrescar();
  }

  private armarFila(ente: Ente): Observable<BienFinancieroRow> {
    return forkJoin({
      detalle: this.obtenerDetalleBien(ente),
      sucursalesData: this.obtenerSucursalesData(ente)
    }).pipe(
      map(({ detalle, sucursalesData }) => {
        const cuotasTotales = this.toNumber(detalle.cantidadCuotas);
        const cuotasPagadas = this.toNumber(detalle.cantidadCuotasPagadas);
        const cuotasFaltantes = Math.max(cuotasTotales - cuotasPagadas, 0);
        const montoTotal = this.toNumber(detalle.montoTotal);
        const montoYaPagado = this.toNumber(detalle.montoYaPagado);
        const montoPendiente = Math.max(montoTotal - montoYaPagado, 0);
        const situacionPago = this.normalizarSituacionPago(detalle.situacionPago, montoPendiente, montoTotal, cuotasFaltantes, cuotasTotales);
        const diaVencimiento = this.toNumber(detalle.diaVencimiento);
        const diasParaVencer = this.calcularDiasParaVencer(diaVencimiento);
        const estadoCuota = this.calcularEstadoCuota(cuotasFaltantes, diaVencimiento, diasParaVencer);
        const moneda = detalle.moneda?.simbolo || 'Gs.';
        const detalleGastos = [
          { concepto: 'Monto total comprometido', monto: montoTotal, moneda },
          { concepto: 'Monto ya pagado', monto: montoYaPagado, moneda },
          { concepto: 'Monto pendiente', monto: montoPendiente, moneda }
        ];

        return {
          id: ente.id,
          tipoEnte: ente.tipoEnte,
          referenciaId: ente.referenciaId,
          activo: ente.activo,
          descripcion: this.resolverDescripcion(ente, detalle),
          sucursal: sucursalesData.texto,
          situacionPago,
          cuotasPagadas,
          cuotasTotales,
          cuotasFaltantes,
          montoTotal,
          montoYaPagado,
          montoPendiente,
          moneda,
          diaVencimiento,
          diasParaVencer,
          estadoCuota,
          estadoCuotaClass: this.resolveEstadoCuotaClass(estadoCuota),
          proveedor: detalle?.proveedor?.nombre || 'No definido',
          detalleGastos,
          sucursalIds: sucursalesData.ids
        };
      }),
      catchError(() => of({
        id: ente.id,
        tipoEnte: ente.tipoEnte,
        referenciaId: ente.referenciaId,
        activo: ente.activo,
        descripcion: `Bien #${ente?.referenciaId || ''}`,
        sucursal: 'Sin sucursal',
        situacionPago: 'EN PAGO',
        cuotasPagadas: 0,
        cuotasTotales: 0,
        cuotasFaltantes: 0,
        montoTotal: 0,
        montoYaPagado: 0,
        montoPendiente: 0,
        moneda: 'Gs.',
        diaVencimiento: 0,
        diasParaVencer: 0,
        estadoCuota: 'SIN PLAN' as const,
        estadoCuotaClass: 'estado-sin-plan',
        proveedor: 'No definido',
        detalleGastos: [],
        sucursalIds: []
      }))
    );
  }

  private obtenerDetalleBien(ente: Ente): Observable<Mueble | Inmueble | Vehiculo | any> {
    if (!ente?.referenciaId || !ente?.tipoEnte) return of({});
    switch (ente.tipoEnte) {
      case TipoEnte.MUEBLE:
        return this.muebleService.onBuscarPorId(ente.referenciaId);
      case TipoEnte.INMUEBLE:
        return this.inmuebleService.onBuscarPorId(ente.referenciaId);
      case TipoEnte.VEHICULO:
        return this.vehiculoService.onBuscarPorId(ente.referenciaId);
      default:
        return of({});
    }
  }

  private obtenerSucursalesData(ente: Ente): Observable<{ texto: string; ids: number[] }> {
    const enteId = ente?.id;
    const referenciaId = ente?.referenciaId;
    const obsEnteSucursal = enteId
      ? this.enteService.getEnteSucursalByEnteId(enteId).pipe(catchError(() => of([])))
      : of([]);
    const obsVehiculoSucursal = (ente?.tipoEnte === TipoEnte.VEHICULO && referenciaId)
      ? this.vehiculoService.onBuscarVehiculosSucursalPorVehiculo(referenciaId).pipe(catchError(() => of([])))
      : of([]);

    return forkJoin({
      asignacionesEnte: obsEnteSucursal,
      asignacionesVehiculo: obsVehiculoSucursal
    }).pipe(
      map(({ asignacionesEnte, asignacionesVehiculo }: { asignacionesEnte: any[]; asignacionesVehiculo: any[] }) => {
        const merged = [...(asignacionesEnte || []), ...(asignacionesVehiculo || [])];
        const uniqueById = new Map<number, string>();
        merged.forEach((a: any) => {
          const id = a?.sucursal?.id;
          const nombre = a?.sucursal?.nombre;
          if (id && nombre && !uniqueById.has(id)) uniqueById.set(id, nombre);
        });
        const ids = Array.from(uniqueById.keys());
        const nombres = Array.from(uniqueById.values());
        return {
          texto: nombres.length ? nombres.join(', ') : 'Sin sucursal',
          ids
        };
      })
    );
  }

  private resolverDescripcion(ente: Ente, detalle: any): string {
    if (ente?.tipoEnte === TipoEnte.MUEBLE) {
      return detalle?.descripcion || detalle?.identificador || `Mueble #${ente?.referenciaId || ''}`;
    }
    if (ente?.tipoEnte === TipoEnte.INMUEBLE) {
      return detalle?.nombreAsignado || detalle?.direccion || `Inmueble #${ente?.referenciaId || ''}`;
    }
    if (ente?.tipoEnte === TipoEnte.VEHICULO) {
      return detalle?.chapa || detalle?.modelo?.descripcion || `Vehículo #${ente?.referenciaId || ''}`;
    }
    return `Bien #${ente?.referenciaId || ''}`;
  }

  private normalizarSituacionPago(valor?: string, montoPendiente?: number, montoTotal?: number, cuotasFaltantes?: number, cuotasTotales?: number): string {
    const raw = (valor || '').trim().toUpperCase();
    if (!raw) return 'NO DEFINIDO';

    if (raw === 'PAGANDO') {
      const hasMonto = (montoTotal || 0) > 0;
      const hasCuotas = (cuotasTotales || 0) > 0;
      
      const isMontoPagado = hasMonto ? (montoPendiente || 0) <= 0 : null;
      const isCuotasPagadas = hasCuotas ? (cuotasFaltantes || 0) <= 0 : null;
      
      if (hasMonto && hasCuotas) {
        if (isMontoPagado === true && isCuotasPagadas === true) return 'PAGADO';
      } else if (hasMonto) {
        if (isMontoPagado === true) return 'PAGADO';
      } else if (hasCuotas) {
        if (isCuotasPagadas === true) return 'PAGADO';
      }
    }

    return raw;
  }

  private calcularDiasParaVencer(diaVencimiento?: number): number {
    if (!diaVencimiento || diaVencimiento < 1 || diaVencimiento > 31) return 0;
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();
    const maxDiaMes = new Date(y, m + 1, 0).getDate();
    const diaMesActual = Math.min(diaVencimiento, maxDiaMes);
    let proximo = new Date(y, m, diaMesActual);
    if (proximo < hoy) {
      const maxDiaMesSiguiente = new Date(y, m + 2, 0).getDate();
      proximo = new Date(y, m + 1, Math.min(diaVencimiento, maxDiaMesSiguiente));
    }
    return Math.ceil((proximo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calcularEstadoCuota(cuotasFaltantes: number, diaVencimiento: number, diasParaVencer: number): BienFinancieroRow['estadoCuota'] {
    if (cuotasFaltantes <= 0) return 'PAGADO';
    if (!diaVencimiento) return 'SIN PLAN';
    if (diasParaVencer < 0) return 'VENCIDO';
    if (diasParaVencer <= 5) return 'POR VENCER';
    return 'AL DIA';
  }

  private detectarMonedaPrincipal(rows: BienFinancieroRow[]): string {
    const withSymbol = rows.find(r => !!r.moneda);
    return withSymbol?.moneda || 'Gs.';
  }

  private toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private crearResumen(rows: BienFinancieroRow[]): DashboardResumen {
    return rows.reduce((acc, row) => {
      const pagado = row.situacionPago === 'PAGADO' || row.montoPendiente <= 0;
      acc.totalBienes += 1;
      acc.pagados += pagado ? 1 : 0;
      acc.enPago += pagado ? 0 : 1;
      acc.cuotasFaltantes += row.cuotasFaltantes;
      acc.totalGastado += row.montoYaPagado;
      acc.totalComprometido += row.montoTotal;
      acc.totalPendiente += row.montoPendiente;
      return acc;
    }, {
      totalBienes: 0,
      pagados: 0,
      enPago: 0,
      cuotasFaltantes: 0,
      totalGastado: 0,
      totalComprometido: 0,
      totalPendiente: 0
    } as DashboardResumen);
  }

  toggleExpand(row: BienFinancieroRow): void {
    this.expandedRow = this.expandedRow?.id === row.id ? null : row;
  }

  private resolveEstadoCuotaClass(estado: string): string {
    switch (estado) {
      case 'PAGADO': return 'estado-pagado';
      case 'VENCIDO': return 'estado-vencido';
      case 'POR VENCER': return 'estado-por-vencer';
      case 'AL DIA': return 'estado-al-dia';
      default: return 'estado-sin-plan';
    }
  }
}
