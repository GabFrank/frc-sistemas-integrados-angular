import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Cliente, TipoCliente } from '../cliente.model';
import { ClienteService } from '../cliente.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MainService } from '../../../../main.service';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { AddClienteDialogComponent } from '../add-cliente-dialog/add-cliente-dialog.component';
import { ROLES } from '../../roles/roles.enum';
import { MatDialog } from '@angular/material/dialog';
import { updateDataSource, updateDataSourceWithId } from '../../../../commons/core/utils/numbersUtils';
import { ListVentaCreditoComponent } from '../../../financiero/venta-credito/list-venta-credito/list-venta-credito.component';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { PageInfo } from '../../../../app.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-clientes',
  templateUrl: './list-clientes.component.html',
  styleUrls: ['./list-clientes.component.scss'],
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
export class ListClientesComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;

  readonly ROLES = ROLES;

  displayedColumns = [
    "id",
    "tipo",
    "nombre",
    "credito",
    "saldo",
    "deuda",
    "contactos",
    "telefono",
    "usuario",
    "acciones"
  ]

  buscarControl = new FormControl(null);
  tipoClienteControl = new FormControl(null)
  creditoControl = new FormControl(null);
  saldoControl = new FormControl(null);
  deudaControl = new FormControl(null);
  dataSource = new MatTableDataSource<Cliente>([]);
  isLastPage = false;
  isSearching = false;
  expandedCliente: Cliente;
  timer;
  tipoClienteList = Object.keys(TipoCliente)

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  orderById = null;
  orderByNombre = null;
  selectedPageInfo: PageInfo<Cliente>;


  constructor(
    private clienteService: ClienteService,
    public mainService: MainService,
    private tabService: TabService,
    private dialog: MatDialog
  ) {

  }

  ngOnInit(): void {
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1])
      this.pageSize = this.paginator.pageSizeOptions[1]
      this.onFiltrar()
    }, 0);

    this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.pageIndex = 0;
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      if (res != null && res?.length > 0) {
        this.timer = setTimeout(() => {
          this.onFiltrar()
        }, 500);
      } else {
        this.dataSource.data = []
      }
    })
  }

  onFiltrar() {
    this.clienteService.onSearchConFiltros(this.buscarControl.value, this.tipoClienteControl.value, this.pageIndex, this.pageSize).pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        this.selectedPageInfo = res;
        this.dataSource.data = this.selectedPageInfo?.getContent;
      }
    })
  }

  resetFiltro() {
    this.pageIndex = 0;
    this.dataSource.data = [];
    this.selectedPageInfo = null;
    this.buscarControl.setValue(null)
  }

  onEditCliente(cliente: Cliente, i) {
    this.dialog.open(AddClienteDialogComponent, {
      data: {
        cliente: cliente
      },
      width: '60%',
      disableClose: true
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.dataSource.data = updateDataSourceWithId(this.dataSource.data, res, cliente.id);
        this.table.renderRows();
      }
    })
  }

  onNewCliente() {
    this.dialog.open(AddClienteDialogComponent, {
      width: '60%',
      disableClose: true
    }).afterClosed().subscribe((res: Cliente) => {
      if (res != null) {
        this.buscarControl.setValue(res.persona.nombre)
        this.dataSource.data = [res]
      }
    })
  }

  onVerMovimiento(cliente, i) {
    console.log(cliente);
    
    this.tabService.addTab(new Tab(ListVentaCreditoComponent, "V. credito de " + cliente.persona.nombre, new TabData(cliente.id, cliente), ListClientesComponent))
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

}
