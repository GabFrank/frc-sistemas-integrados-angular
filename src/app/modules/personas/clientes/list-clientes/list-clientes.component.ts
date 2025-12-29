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
import { SelectionModel } from '@angular/cdk/collections';
import { VentaCreditoService } from '../../../financiero/venta-credito/venta-credito.service';
import { EstadoVentaCredito, VentaCredito, VentaCreditoInput } from '../../../financiero/venta-credito/venta-credito.model';
import { forkJoin } from 'rxjs';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

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
    "select",
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
  selection = new SelectionModel<Cliente>(true, []);


  constructor(
    private clienteService: ClienteService,
    public mainService: MainService,
    private tabService: TabService,
    private dialog: MatDialog,
    private ventaCreditoService: VentaCreditoService,
    private dialogoService: DialogosService,
    private notificacionService: NotificacionSnackbarService
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
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = this.selectedPageInfo?.getContent;
        this.selection.clear();
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

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected == numRows;
  }

  masterToggle(ref) {
    if (this.isSomeSelected()) {
      this.selection.clear();
      ref.checked = false;
    } else {
      this.isAllSelected()
        ? this.selection.clear()
        : this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }

  isSomeSelected() {
    return this.selection.selected.length > 0;
  }

  async onCobrarTodoEImprimir() {
    if (this.selection.selected.length === 0) {
      this.notificacionService.openAlgoSalioMal('Por favor seleccione al menos un cliente');
      return;
    }

    this.dialogoService
      .confirm(
        'Atención!!',
        `¿Realmente desea cobrar todo e imprimir recibo para ${this.selection.selected.length} cliente(s) seleccionado(s)?`,
        'Se generará un reporte por cada cliente seleccionado'
      )
      .subscribe((res) => {
        if (res == true) {
          this.procesarCobroEImpresion();
        }
      });
  }

  private async procesarCobroEImpresion() {
    const clientesSeleccionados = this.selection.selected;

    if (clientesSeleccionados.length === 0) {
      return;
    }

    const observables = [];

    for (const cliente of clientesSeleccionados) {
      const ventaCreditoObservable = this.ventaCreditoService.onGetPorCliente(
        cliente.id,
        null,
        null,
        EstadoVentaCredito.ABIERTO,
        false
      );

      observables.push(
        ventaCreditoObservable.pipe(
          untilDestroyed(this)
        )
      );
    }

    if (observables.length === 0) {
      this.notificacionService.openAlgoSalioMal('No hay clientes para procesar');
      return;
    }

    forkJoin(observables).pipe(untilDestroyed(this)).subscribe({
      next: (results: VentaCredito[][]) => {
        const clienteVentaCreditoList: any[] = [];
        let totalClientesConVentas = 0;

        results.forEach((ventaCreditos, index) => {
          const cliente = clientesSeleccionados[index];

          if (ventaCreditos && ventaCreditos.length > 0) {
            const ventaCreditoInputList: VentaCreditoInput[] = [];
            ventaCreditos.forEach((vc) => {
              let aux: VentaCredito = new VentaCredito();
              Object.assign(aux, vc);
              ventaCreditoInputList.push(aux.toInput());
            });

            clienteVentaCreditoList.push({
              clienteId: cliente.id,
              ventaCreditoInputList: ventaCreditoInputList
            });
            totalClientesConVentas++;
          }
        });

        if (totalClientesConVentas > 0) {
          this.ventaCreditoService.onImprimirReporteCobroMultiplesClientes(
            clienteVentaCreditoList,
            this.mainService.usuarioActual.id
          );

          this.notificacionService.openSucess(
            `Se generó el reporte combinado con ${totalClientesConVentas} cliente(s) correctamente`
          );
        } else {
          this.notificacionService.openAlgoSalioMal(
            'No se encontraron ventas a crédito abiertas para los clientes seleccionados'
          );
        }
        this.selection.clear();
      },
      error: (error) => {
        console.error('Error al procesar cobro e impresión:', error);
        this.notificacionService.openAlgoSalioMal(
          'Ocurrió un error al generar el reporte. Por favor intente nuevamente.'
        );
      }
    });
  }

}
