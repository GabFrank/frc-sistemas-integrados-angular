import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EnteService } from '../../service/ente.service';
import { Ente } from '../../models/ente.model';
import { MainService } from '../../../../../main.service';
import { MatDialog } from '@angular/material/dialog';
import { EnteSucursalDialogComponent } from '../../dialogs/ente-sucursal-dialog/ente-sucursal-dialog.component';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../../notificacion-snackbar.service';
import { forkJoin, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { TipoEnte } from '../../enums/tipo-ente.enum';
import { EnteSucursal } from '../../models/ente-sucursal.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';

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
  public mainService = inject(MainService);
  private matDialog = inject(MatDialog);
  private notificationService = inject(NotificacionSnackbarService);
  private sucursalService = inject(SucursalService);
  private cdr = inject(ChangeDetectorRef);

  muebleControl = new FormControl('');
  inmuebleControl = new FormControl('');
  equipoControl = new FormControl('');
  vehiculoControl = new FormControl('');
  sucursalControl = new FormControl<number | null>(null);
  sucursales: Sucursal[] = [];

  private lastActiveTipo: TipoEnte | null = null;

  public allRows$ = this.enteService.entes$.pipe(
    switchMap(entes => {
      if (!entes?.length) return of([]);
      return forkJoin(entes.map(ente => this.armarFila(ente)));
    }),
    shareReplay(1)
  );

  public filteredRows$ = this.allRows$.pipe(
    tap(() => {
      this.expandedRow = null;
    })
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

  ngOnInit(): void {
    this.cargarSucursales();
    this.enteService.setSucursalId(null);
    this.enteService.setFilters(null, null, null);
    this.enteService.setSearchText('');
    this.initFiltros();
    this.enteService.refrescar();
  }

  private cargarSucursales(): void {
    this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this)).subscribe(res => {
      this.sucursales = res || [];
      this.cdr.markForCheck();
    });
  }

  private initFiltros(): void {
    const configs: { control: FormControl<string | null>; tipo: TipoEnte; others: FormControl<string | null>[] }[] = [
      { control: this.muebleControl, tipo: TipoEnte.MUEBLE, others: [this.inmuebleControl, this.equipoControl, this.vehiculoControl] },
      { control: this.inmuebleControl, tipo: TipoEnte.INMUEBLE, others: [this.muebleControl, this.equipoControl, this.vehiculoControl] },
      { control: this.equipoControl, tipo: TipoEnte.EQUIPO, others: [this.muebleControl, this.inmuebleControl, this.vehiculoControl] },
      { control: this.vehiculoControl, tipo: TipoEnte.VEHICULO, others: [this.muebleControl, this.inmuebleControl, this.equipoControl] },
    ];

    configs.forEach(({ control, tipo, others }) => {
      control.valueChanges.pipe(
        untilDestroyed(this),
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(texto => {
        const value = (texto || '').trim();
        if (value) {
          others.forEach(c => c.setValue('', { emitEvent: false }));
          this.lastActiveTipo = tipo;
          this.enteService.setFilters(tipo, null, null);
          this.enteService.setSearchText(value);
        } else if (this.lastActiveTipo === tipo) {
          this.lastActiveTipo = null;
          this.enteService.setFilters(null, null, null);
          this.enteService.setSearchText('');
        }
      });
    });
  }

  onSucursalChanged(sucursal: Sucursal | null): void {
    this.sucursalControl.setValue(sucursal?.id ?? null);
    this.enteService.setSucursalId(sucursal?.id ?? null);
  }

  onAdicionar(): void {
    this.matDialog.open(EnteSucursalDialogComponent, {
      data: {},
      width: '600px'
    }).afterClosed().pipe(
      filter(res => !!res)
    ).subscribe(() => {
      this.enteService.refrescar();
    });
  }

  onEditar(row: BienFinancieroRow): void {
    if (!row.id) return;

    const obs = this.enteService.getEnteSucursalByEnteId(row.id).pipe(map(res => (res as EnteSucursal[])[0] || null));

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
                ente
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
    const sucursalId = ente.sucursalIds?.length === 1 ? ente.sucursalIds[0] : null;
    if (!sucursalId || !ente?.id) {
      this.notificationService.openWarn('Seleccione un bien vinculado a una sola sucursal para retirarlo');
      return;
    }

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
    this.muebleControl.setValue('');
    this.inmuebleControl.setValue('');
    this.equipoControl.setValue('');
    this.vehiculoControl.setValue('');
    this.sucursalControl.setValue(null);
    this.lastActiveTipo = null;
    this.enteService.setSucursalId(null);
    this.enteService.setFilters(null, null, null);
    this.enteService.setSearchText('');
    this.enteService.refrescar();
  }

  isCuotaPagada(row: BienFinancieroRow): boolean {
    return row.situacionPago === 'PAGADO'
      || row.montoPendiente <= 0
      || row.cuotasFaltantes <= 0;
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
