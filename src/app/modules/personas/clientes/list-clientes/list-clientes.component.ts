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
  page = 0;
  size = 20;
  tipoClienteList = Object.keys(TipoCliente)


  constructor(
    private clienteService: ClienteService,
    public mainService: MainService,
    private tabService: TabService,
    private dialog: MatDialog
  ) {

  }

  ngOnInit(): void {
    this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.page = 0;
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

  cargarMasDatos() {
    this.page++;
    this.onFiltrar()
  }

  onFiltrar() {
    this.clienteService.onSearchConFiltros(this.buscarControl.value, this.tipoClienteControl.value, this.page, this.size).pipe(untilDestroyed(this)).subscribe(res => {
      this.isLastPage = false;
      if (this.page > 0) {
        this.dataSource.data = this.dataSource.data.concat(res)
      } else {
        this.dataSource.data = res;
      }
      if (res?.length < this.size) this.isLastPage = true;
    })
  }

  resetFiltro() {
    this.page = 0;
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
    this.tabService.addTab(new Tab(ListVentaCreditoComponent, "V. credito de " + cliente.persona.nombre, new TabData(cliente.id), ListClientesComponent))
  }

}
