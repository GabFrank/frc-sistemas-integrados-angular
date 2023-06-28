import { Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Retiro } from '../retiro.model';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { RetiroService } from '../retiro.service';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { FormControl, FormGroup } from '@angular/forms';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { PdvCaja } from '../../pdv/caja/caja.model';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { ListVentaComponent } from '../../../operaciones/venta/list-venta/list-venta.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({checkProperties: true})
@Component({
  selector: 'app-list-retiro',
  templateUrl: './list-retiro.component.html',
  styleUrls: ['./list-retiro.component.scss'],
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
export class ListRetiroComponent implements OnInit {

  @Input()
  data: Tab;

  dataSource = new MatTableDataSource<Retiro>([])
  selectedRetiro: Retiro;
  expandedRetiro: Retiro;
  isLastPage = true;
  isSearching = false;
  displayedColumns = [
    'id',
    'sucursal',
    'cajaSalida',
    'retiroGs',
    'retiroRs',
    'retiroDs',
    'responsable',
    'creadoEn',
    'usuario'
  ]
  page = 0;
  size = 20;

  sucursalList: Sucursal[]
  sucOrigenControl = new FormControl()
  idCajaControl = new FormControl()
  idRetiroControl = new FormControl()
  formGroup : FormGroup;

  constructor(
    private retiroService: RetiroService,
    private sucursalService: SucursalService,
    private tabService: TabService
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      idCajaControl: this.idCajaControl,
      idRetiroControl: this.idRetiroControl,
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

    // this.retiroService.onFilterRetiro(null, this.data?.tabData?.data?.caja?.id, this.data?.tabData?.data?.sucursal?.id, null, null, this.page, this.size).subscribe(res => {
    //   this.dataSource.data = res;
    //   if(this.dataSource.data?.length == this.size){
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
    this.retiroService.onFilterRetiro(this.idRetiroControl.value, this.idCajaControl.value, this.sucOrigenControl.value?.id, null, null, this.page, this.size).subscribe(res => {      
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
    this.sucOrigenControl.setValue(null)
    this.idCajaControl.setValue(null)
    this.idRetiroControl.setValue(null)
    this.dataSource.data = []
  }

  onIrACaja(cajaSalida: PdvCaja){
    this.tabService.addTab(new Tab(ListVentaComponent, 'Venta de la caja ' + cajaSalida.id, new TabData(null, cajaSalida), ListRetiroComponent))
  }

}
