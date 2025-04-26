import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { GastoService } from '../gasto.service';
import { Gasto } from '../gastos.model';


import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl, FormGroup } from '@angular/forms';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { ListVentaComponent } from '../../../operaciones/venta/list-venta/list-venta.component';
import { PdvCaja } from '../../pdv/caja/caja.model';
import { PageInfo } from '../../../../app.component';
import { PageEvent } from '@angular/material/paginator';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-gastos',
  templateUrl: './list-gastos.component.html',
  styleUrls: ['./list-gastos.component.scss'],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListGastosComponent implements OnInit {

  @Input()
  data: Tab;

  dataSource = new MatTableDataSource<Gasto>([])
  selectedGasto: Gasto;
  expandedGasto: Gasto;
  isLastPage = true;
  isSearching = false;
  displayedColumns = [
    'id',
    'sucursal',
    'caja',
    'responsable',
    'observacion',
    'retiroGs',
    'retiroRs',
    'retiroDs',
    'creadoEn'
  ]
  pageIndex = 0;
  pageSize = 15;

  sucursalList: Sucursal[]
  sucOrigenControl = new FormControl()
  idCajaControl = new FormControl()
  idGastoControl = new FormControl()
  descripcionControl = new FormControl()
  formGroup : FormGroup;
  selectedPageInfo: PageInfo<Gasto>;

  constructor(
    private gastoService: GastoService,
    private sucursalService: SucursalService,
    private tabService: TabService
  ) { }

  ngOnInit(): void {

    this.formGroup = new FormGroup({
      idCajaControl: this.idCajaControl,
      idRetiroControl: this.idGastoControl,
      sucursalControl: this.sucOrigenControl,
      descripcionControl: this.descripcionControl
    })

    this.sucursalService.onGetAllSucursales().subscribe(res => {
      this.sucursalList = res.filter(s => s.id != 0)
      this.sucOrigenControl.setValue(this.sucursalList.find(s => s.id == this.data?.tabData?.data?.sucursal?.id))
      this.idCajaControl.setValue(this.data?.tabData?.data?.caja?.id);
      this.onFiltrar();
    })

  }

  cargarMasDatos() {

  }

  onFiltrar() {
    this.gastoService.onFilterGasto(this.idGastoControl.value, this.idCajaControl.value, this.sucOrigenControl.value?.id, null, this.descripcionControl.value, this.pageIndex, this.pageSize).subscribe((res: PageInfo<Gasto>) => {
      if(res!=null){
        this.selectedPageInfo = res;
        this.dataSource.data = this.selectedPageInfo.getContent;
      }
    })
  }

  resetFiltro() {
    this.idCajaControl.setValue(null);
    this.sucOrigenControl.setValue(null);
    this.idCajaControl.setValue(null);
    this.dataSource.data = []
  }

  onIrACaja(cajaSalida: PdvCaja) {
    this.tabService.addTab(new Tab(ListVentaComponent, 'Ventas de la caja ' + this.selectedGasto.caja.id, new TabData(null, this.selectedGasto.caja), ListGastosComponent))
  }

  onAdd(gasto, i){

  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

}
