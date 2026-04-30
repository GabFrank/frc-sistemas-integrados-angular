import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { GastoService } from '../../service/gasto.service';
import { Gasto } from '../../models/gastos.model';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormControl } from '@angular/forms';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { TabService, TabData } from '../../../../../layouts/tab/tab.service';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { ListVentaComponent } from '../../../../operaciones/venta/list-venta/list-venta.component';
import { PdvCaja } from '../../../pdv/caja/caja.model';
import { PageEvent } from '@angular/material/paginator';
import { combineLatest, BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap, map, shareReplay } from 'rxjs/operators';
import { ListPreGastosComponent } from '../list-pre-gastos/list-pre-gastos.component';
import { GastosDashboardComponent } from '../gastos-dashboard/gastos-dashboard.component';

@UntilDestroy()
@Component({
  selector: 'app-list-gastos',
  templateUrl: './list-gastos.component.html',
  styleUrls: ['./list-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition("expanded <=> collapsed", animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")),
    ]),
  ],
})
export class ListGastosComponent implements OnInit {
  @Input() data: Tab;

  private gastoService = inject(GastoService);
  private sucursalService = inject(SucursalService);
  private tabService = inject(TabService);

  expandedGasto: Gasto;
  
  displayedColumns = [
    'id', 'sucursal', 'caja', 'responsable', 'autorizadoPor', 'tipoGasto', 'estadoSolicitud', 'observacion',
    'retiroGs', 'retiroRs', 'retiroDs', 'creadoEn', 'acciones'
  ];

  sucursalList$ = this.sucursalService.onGetAllSucursales(true).pipe(map(s => s.filter(x => x.id !== 0)));

  sucOrigenControl = new FormControl();
  idCajaControl = new FormControl();
  idGastoControl = new FormControl();
  descripcionControl = new FormControl();

  private paginationSubject = new BehaviorSubject<{ pageIndex: number, pageSize: number }>({ pageIndex: 0, pageSize: 15 });
  public pagination$ = this.paginationSubject.asObservable();
  private refetchSubject = new BehaviorSubject<void>(void 0);

  public totalElements$ = new BehaviorSubject<number>(0);

  public gastos$: Observable<Gasto[]> = combineLatest([
    this.refetchSubject,
    this.pagination$
  ]).pipe(
    switchMap(([_, pag]) => this.gastoService.onFilterGasto(
      this.idGastoControl.value,
      this.idCajaControl.value,
      this.sucOrigenControl.value?.id,
      null,
      this.descripcionControl.value,
      pag.pageIndex,
      pag.pageSize
    )),
    tap(res => {
      if (res) this.totalElements$.next(res.getTotalElements);
    }),
    map(res => res?.getContent || []),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngOnInit(): void {
    if (this.data?.tabData?.data?.caja?.id) {
      this.idCajaControl.setValue(this.data.tabData.data.caja.id);
    }
  }

  onFiltrar() {
    this.refetchSubject.next();
  }

  resetFiltro() {
    this.idCajaControl.reset();
    this.sucOrigenControl.reset();
    this.idGastoControl.reset();
    this.descripcionControl.reset();
    this.onFiltrar();
  }

  onIrACaja(cajaSalida: PdvCaja) {
    if (cajaSalida) {
      this.tabService.addTab(new Tab(
        ListVentaComponent, 
        'Ventas de la caja ' + cajaSalida.id, 
        new TabData(null, cajaSalida), 
        ListGastosComponent
      ));
    }
  }

  onIrASolicitudGasto(gasto: Gasto): void {
    const buscarId = gasto?.preGasto?.id || gasto?.id;
    if (!buscarId) return;

    this.tabService.addTab(new Tab(
      ListPreGastosComponent,
      'Solicitudes de Gasto',
      new TabData(null, { buscarId }),
      GastosDashboardComponent
    ));
  }

  onAdd(gasto: Gasto, i: number) {
    // Implementar editar
  }

  getTipoGastoDescripcion(gasto: Gasto): string {
    return gasto?.preGasto?.tipoGasto?.descripcion || gasto?.tipoGasto?.descripcion || '-';
  }

  getEstadoSolicitud(gasto: Gasto): string {
    return gasto?.preGasto?.estado || '-';
  }

  getEstadoSolicitudColor(gasto: Gasto): string {
    const estadoColor = gasto?.preGasto?.estadoColor;
    if (estadoColor) {
      return estadoColor;
    }
    switch (gasto?.preGasto?.estado) {
      case 'PENDIENTE':
        return '#ffb300';
      case 'TRAMITE':
        return '#29b6f6';
      case 'AUTORIZADO':
        return '#66bb6a';
      case 'RECHAZADO':
        return '#ef5350';
      case 'COMPLETADO':
        return '#26a69a';
      default:
        return '#9e9e9e';
    }
  }

  getEstadoSolicitudIcono(gasto: Gasto): string {
    const estadoIcono = gasto?.preGasto?.estadoIcono;
    if (estadoIcono) {
      return estadoIcono;
    }
    switch (gasto?.preGasto?.estado) {
      case 'PENDIENTE':
        return 'schedule';
      case 'TRAMITE':
        return 'hourglass_top';
      case 'AUTORIZADO':
        return 'check_circle';
      case 'RECHAZADO':
        return 'cancel';
      case 'COMPLETADO':
        return 'task_alt';
      default:
        return 'help_outline';
    }
  }

  getEstadoSolicitudEtiqueta(gasto: Gasto): string {
    return gasto?.preGasto?.estadoEtiqueta || gasto?.preGasto?.estado || '-';
  }

  getAutorizadoPor(gasto: Gasto): string {
    return gasto?.autorizadoPor?.persona?.nombre || '-';
  }

  handlePageEvent(e: PageEvent) {
    this.paginationSubject.next({ pageIndex: e.pageIndex, pageSize: e.pageSize });
  }
}
