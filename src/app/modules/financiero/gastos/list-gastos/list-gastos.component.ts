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
  page = 0;
  size = 20;

  sucursalList: Sucursal[]
  sucOrigenControl = new FormControl()
  idCajaControl = new FormControl()
  idGastoControl = new FormControl()
  formGroup : FormGroup;

  constructor(
    private gastoService: GastoService,
    private sucursalService: SucursalService,
    private tabService: TabService
  ) { }

  ngOnInit(): void {

    this.formGroup = new FormGroup({
      idCajaControl: this.idCajaControl,
      idRetiroControl: this.idGastoControl,
      sucursalControl: this.sucOrigenControl
    })

    this.formGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.page = 0;
      this.isLastPage = true;
    })

    this.sucursalService.onGetAllSucursales().subscribe(res => {
      this.sucursalList = res.filter(s => s.id != 0)
      this.sucOrigenControl.setValue(this.sucursalList.find(s => s.id == this.data?.tabData?.data?.sucursal?.id))
      this.idCajaControl.setValue(this.data?.tabData?.data?.caja?.id);
    })

    // this.gastoService.onFilterGasto(null, this.data?.tabData?.data?.caja?.id, this.data?.tabData?.data?.sucursal?.id, null, this.page, this.size).subscribe(res => {
    //   this.dataSource.data = res;
    //   if (this.dataSource.data?.length == this.size) {
    //     this.isLastPage = false;
    //   } else {
    //     this.isLastPage = true;
    //   }
    // })
  }

  cargarMasDatos() {
    this.page++;
    this.onFiltrar()
  }

  onFiltrar() {
    this.gastoService.onFilterGasto(this.idGastoControl.value, this.idCajaControl.value, this.sucOrigenControl.value?.id, null, this.page, this.size+1).subscribe(res => {
      if(this.page > 0){
        let arr: any[] = [...this.dataSource.data]
        arr = arr.concat(res)
        this.dataSource.data = arr;
      } else {
        this.dataSource.data = res;
      }
      if(res.length < this.size){
        this.isLastPage = true;
      } else {
        this.isLastPage = false;
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
    this.tabService.addTab(new Tab(ListVentaComponent, 'Venta de la caja ' + cajaSalida.id, new TabData(null, cajaSalida), ListGastosComponent))
  }

  onAdd(gasto, i){

  }

}
