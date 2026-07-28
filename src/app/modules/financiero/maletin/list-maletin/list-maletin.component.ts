import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { AdicionarMaletinDialogComponent } from '../adicionar-maletin-dialog/adicionar-maletin-dialog.component';
import { Maletin } from '../maletin.model';
import { MaletinService } from '../maletin.service';


import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatPaginator } from '@angular/material/paginator';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { ListVentaComponent } from '../../../operaciones/venta/list-venta/list-venta.component';
import { PdvCaja } from '../../pdv/caja/caja.model';
import { ListRetiroComponent } from '../../retiro/list-retiro/list-retiro.component';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-maletin',
  templateUrl: './list-maletin.component.html',
  styleUrls: ['./list-maletin.component.scss'],
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
export class ListMaletinComponent implements OnInit {

  @ViewChild('paginator', { static: true }) paginator: MatPaginator;

  headerHeight;
  tableHeight;
  containerHeight;
  displayedColumns: string[] = ['id', 'descripcion', 'sucursalActual', 'cajaActual', 'activo', 'creadoEn', 'usuario', 'acciones'];
  expandedMaletin: Maletin;
  selectedMaletin: Maletin;
  resultsLength = 0;
  dataSource = new MatTableDataSource<Maletin>(null);


  isLastPage = false;
  isSearching = false;

  sucursalList: Sucursal[] = [];
  maletinList: Maletin[] = [];

  sucursalControl = new FormControl(null);
  codigoControl = new FormControl(null);
  // tri-estado: null = todos, true = abiertos, false = cerrados
  abiertoControl = new FormControl(null);


  constructor(
    private maletinService: MaletinService,
    public windowInfoService: WindowInfoService,
    private matDialog: MatDialog,
    private tabService: TabService,
    private sucursalService: SucursalService
  ) {
    this.headerHeight = windowInfoService.innerTabHeight * 0.2;
    this.tableHeight = windowInfoService.innerTabHeight * 0.8;
    this.containerHeight = windowInfoService.innerTabHeight;
  }

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales(true)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) this.sucursalList = res.filter(s => s.id != 0);
      })
    this.onFiltrar()
  }

  rowSelectedEvent(e) {
  }

  onAdd(maletin?: Maletin, index?) {
    this.matDialog.open(AdicionarMaletinDialogComponent, {
      data: {
        maletin
      },
      disableClose: true,
      width: '70%',
      autoFocus: true,
      restoreFocus: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        if (maletin == null) {
          this.dataSource.data = updateDataSource(this.dataSource.data, res);
        } else {
          this.dataSource.data = updateDataSource(this.dataSource.data, res, index);
        }
      }
    })
  }

  cargarMasDatos() {

  }
  onFiltrar() {
    this.maletinService.onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.maletinList = res;
          this.aplicarFiltros();
        }
      })
  }

  aplicarFiltros() {
    const sucursalId = this.sucursalControl.value?.id;
    const codigo = (this.codigoControl.value || '').toString().trim().toLowerCase();
    const abierto = this.abiertoControl.value;

    this.dataSource.data = (this.maletinList || []).filter(maletin =>
      (sucursalId == null || maletin?.sucursal?.id == sucursalId) &&
      (codigo == '' || (maletin?.descripcion || '').toLowerCase().includes(codigo)) &&
      (abierto == null || (maletin?.abierto == true) == abierto)
    );
  }

  onCambiarAbierto() {
    this.abiertoControl.setValue(
      this.abiertoControl.value === null
        ? true
        : this.abiertoControl.value === true
          ? false
          : null
    );
  }

  resetFiltro() {
    this.sucursalControl.setValue(null);
    this.codigoControl.setValue(null);
    this.abiertoControl.setValue(null);
    this.aplicarFiltros();
  }

  onIrACaja(cajaSalida: PdvCaja){
    this.tabService.addTab(new Tab(ListVentaComponent, 'Venta de la caja ' + cajaSalida.id, new TabData(null, cajaSalida), ListRetiroComponent))
  }
}
