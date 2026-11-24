import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { AdicionarMaletinDialogComponent } from '../adicionar-maletin-dialog/adicionar-maletin-dialog.component';
import { Maletin } from '../maletin.model';
import { MaletinService } from '../maletin.service';


import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
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

  headerHeight;
  tableHeight;
  containerHeight;
  displayedColumns: string[] = ['id', 'descripcion', 'sucursalActual', 'cajaActual', 'activo', 'creadoEn', 'usuario', 'acciones'];
  expandedMaletin: Maletin;
  selectedMaletin: Maletin;
  dataSource = new MatTableDataSource<Maletin>(null);


  sucursalList: Sucursal[] = [];

  /** Maletines paginados en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag: PaginacionLista<Maletin> = new PaginacionLista<Maletin>({
    cargar: (page, size) => this.maletinService.onGetConFiltros(
      this.sucursalControl.value?.id ?? null,
      (this.codigoControl.value || '').toString().trim() || null,
      this.abiertoControl.value,
      page,
      size
    ),
    pageSize: 15,
    alCargar: (res) => this.dataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.dataSource.data = [];
    },
  });

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
        this.cargarPagina();
      }
    })
  }

  // Buscar, Enter y Limpiar vuelven a la página 1; el central filtra y pagina.
  onFiltrar() {
    this.pag.filtrar();
  }

  /** Repite la página a la vista (después de crear o editar). */
  cargarPagina() {
    this.pag.recargar();
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
    this.onFiltrar();
  }

  onIrACaja(cajaSalida: PdvCaja){
    this.tabService.addTab(new Tab(ListVentaComponent, 'Venta de la caja ' + cajaSalida.id, new TabData(null, cajaSalida), ListRetiroComponent))
  }
}
