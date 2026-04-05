import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { GastoService } from '../../service/gasto.service';
import { Gasto } from '../../models/gastos.model';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FormControl, FormGroup } from '@angular/forms';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { TabService, TabData } from '../../../../../layouts/tab/tab.service';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { ListVentaComponent } from '../../../../operaciones/venta/list-venta/list-venta.component';
import { PdvCaja } from '../../../pdv/caja/caja.model';
import { PageEvent } from '@angular/material/paginator';
import { combineLatest, BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';

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
    'id', 'sucursal', 'caja', 'responsable', 'observacion',
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
    map(res => res?.getContent || [])
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

  onAdd(gasto: Gasto, i: number) {
    // Implementar editar
  }

  handlePageEvent(e: PageEvent) {
    this.paginationSubject.next({ pageIndex: e.pageIndex, pageSize: e.pageSize });
  }
}
