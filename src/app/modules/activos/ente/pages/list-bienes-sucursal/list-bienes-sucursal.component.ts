import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
import { filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { TipoEnte } from '../../enums/tipo-ente.enum';
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
    const cuotasTotales = ente.cuotasTotales || 0;
    const cuotasPagadas = ente.cuotasPagadas || 0;
    const cuotasFaltantes = ente.cuotasFaltantes || 0;
    const montoTotal = ente.montoTotal || 0;
    const montoYaPagado = ente.montoYaPagado || 0;
    const montoPendiente = ente.montoPendiente || 0;
    const moneda = ente.monedaSimbolo || 'Gs.';
    const estadoCuota = (ente.estadoCuota as any) || 'SIN PLAN';

    return of({
      id: ente.id,
      tipoEnte: ente.tipoEnte,
      referenciaId: ente.referenciaId,
      activo: ente.activo,
      descripcion: ente.descripcion || `Bien #${ente.referenciaId}`,
      sucursal: ente.sucursalesConcatenadas || 'Sin sucursal',
      situacionPago: ente.situacionPago || 'NO DEFINIDO',
      cuotasPagadas,
      cuotasTotales,
      cuotasFaltantes,
      montoTotal,
      montoYaPagado,
      montoPendiente,
      moneda,
      diaVencimiento: ente.diaVencimiento || 0,
      diasParaVencer: ente.diasParaVencer || 0,
      estadoCuota,
      estadoCuotaClass: this.resolveEstadoCuotaClass(estadoCuota),
      proveedor: ente.proveedorNombre || 'No definido',
      detalleGastos: [
        { concepto: 'Monto total comprometido', monto: montoTotal, moneda },
        { concepto: 'Monto ya pagado', monto: montoYaPagado, moneda },
        { concepto: 'Monto pendiente', monto: montoPendiente, moneda }
      ],
      sucursalIds: (ente as any).sucursalIds || []
    });
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

  private detectarMonedaPrincipal(rows: BienFinancieroRow[]): string {
    if (!rows.length) return 'Gs.';
    const counts = rows.reduce((acc, row) => {
      const m = row.moneda || 'Gs.';
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
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
