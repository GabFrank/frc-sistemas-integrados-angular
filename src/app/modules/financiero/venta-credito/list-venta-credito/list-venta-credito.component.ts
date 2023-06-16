import { ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { Cliente } from '../../../personas/clientes/cliente.model';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { VentaCreditoService } from '../venta-credito.service';
import { MatTableDataSource } from '@angular/material/table';
import { EstadoVentaCredito, VentaCredito, VentaCreditoInput } from '../venta-credito.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { VentaService } from '../../../operaciones/venta/venta.service';
import { FormControl, FormGroup } from '@angular/forms';
import { ClienteService } from '../../../personas/clientes/cliente.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { PagoData, PagoResponseData, PagoTouchComponent } from '../../../pdv/comercial/venta-touch/pago-touch/pago-touch.component';
import { CajaService } from '../../pdv/caja/caja.service';
import { Observable, forkJoin } from 'rxjs';
import { PdvCaja } from '../../pdv/caja/caja.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { VentaTouchComponent } from '../../../pdv/comercial/venta-touch/venta-touch.component';
import { CobroDetalle, CobroDetalleInput } from '../../../operaciones/venta/cobro/cobro-detalle.model';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { SelectionModel } from '@angular/cdk/collections';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-venta-credito',
  templateUrl: './list-venta-credito.component.html',
  styleUrls: ['./list-venta-credito.component.scss'],
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
export class ListVentaCreditoComponent implements OnInit {

  readonly ROLES = ROLES;

  @Input()
  data: Tab;

  dataSource = new MatTableDataSource<VentaCredito>([])
  selectedVentaCredito: VentaCredito;
  estadoControl = new FormControl(EstadoVentaCredito.ABIERTO)
  selectedCliente: Cliente;

  displayedColumns = [
    'select',
    'id',
    'sucursal',
    'valorTotal',
    'fecha',
    'estado',
    'venta',
    'tipoConfirmacion',
    'creadoPor',
    'acciones'
  ]

  isLastPage = false;
  isSearching = false;
  expandedVentaCredito: VentaCredito;

  page = 0;
  size = 20;

  loading = false;

  estadoList = Object.keys(EstadoVentaCredito)

  selection = new SelectionModel<any>(true, []);

  fechaFormGroup: FormGroup;
  fechaInicioControl = new FormControl()
  fechaFinalControl = new FormControl()

  isAbiertos = false;
  isConcluidos = false;

  constructor(
    private dialogRef: MatDialogRef<ListVentaCreditoComponent>,
    private ventaCreditoService: VentaCreditoService,
    public mainService: MainService,
    private ventaService: VentaService,
    private clienteService: ClienteService,
    private dialog: MatDialog,
    private cajaService: CajaService,
    private tabService: TabService,
    private dialogoService: DialogosService
  ) {

    this.estadoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      if (res == EstadoVentaCredito.ABIERTO) {
        this.isLastPage = true
      } else {
        this.isLastPage = false;
      }
    })

  }

  ngOnInit(): void {

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinalControl,
    });


    this.isLastPage = true;
    if (this.data?.tabData?.id != null) {
      this.clienteService.onGetById(this.data.tabData.id).pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.selectedCliente = res;
          this.ventaCreditoService.onGetPorCliente(this.selectedCliente.id, EstadoVentaCredito.ABIERTO, this.page, this.size).pipe(untilDestroyed(this)).subscribe(res => {
            if (res != null) {
              this.dataSource.data = res;
            }
          })
        }
      })
    }

    this.selection.changed.pipe(untilDestroyed(this)).subscribe(res => {
      this.verificarEstados()
    })
  }

  verificarEstados() {
    if (this.selection.selected?.length > 0) {
      this.isAbiertos = true;
      this.isConcluidos = true;
    } else {
      this.isAbiertos = false;
      this.isConcluidos = false;
    }

    this.selection.selected.forEach((s: VentaCredito) => {
      if (s.estado != EstadoVentaCredito.ABIERTO) {
        this.isAbiertos = false;
      }
      if (s.estado != EstadoVentaCredito.FINALIZADO) {
        this.isConcluidos = false;
      }
    })
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected == numRows;
  }

  masterToggle(ref) {
    // console.log(ref);
    // if there is a selection then clear that selection
    if (this.isSomeSelected()) {

      this.selection.clear();
      ref.checked = false;

    } else {
      this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource.data.forEach(row => this.selection.select(row));
    }
    // console.log(ref);
  }

  isSomeSelected() {

    return this.selection.selected.length > 0;
  }

  cargarMasDatos() {
    this.page++;
    this.onFiltrar()
  }

  onFiltrar() {
    this.isAbiertos = false;
    this.isConcluidos = false;
    this.ventaCreditoService.onGetPorCliente(this.selectedCliente.id, this.estadoControl.value, this.page, this.size).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.isLastPage = false;
        if (this.estadoControl.value != EstadoVentaCredito.ABIERTO && this.page > 0) {
          this.dataSource.data = this.dataSource.data.concat(res)
        } else {
          this.dataSource.data = res;
        }
        if (res?.length < this.size) this.isLastPage = true;
      }
    })
    this.verificarEstados()
  }
  resetFiltro() {
    this.page = 0;
    this.estadoControl.setValue(EstadoVentaCredito.ABIERTO)
    this.isAbiertos = false;
    this.isConcluidos = false;
    this.verificarEstados()
  }

  onClickRow(ventaCredito: VentaCredito, i) {
    this.loading = true;
    this.ventaService.onGetPorId(ventaCredito?.venta?.id, ventaCredito?.sucursal?.id).pipe(untilDestroyed(this)).subscribe(res => {
      this.loading = false;
      if (res != null) {
        ventaCredito.venta = res;
        this.dataSource.data[i].venta.ventaItemList = res.ventaItemList;
      }
    })
  }

  onCancelar(ventaCredito: VentaCredito, index) {
    this.dialogoService.confirm('Atención!!', 'Realmente desea cancelar este item?', 'Esta acción no se puede deshacer').subscribe(res => {
      this.ventaCreditoService.onCancelarVentaCredito(ventaCredito.id, ventaCredito.sucursal.id).pipe(untilDestroyed(this)).subscribe(res => {
        if (res == true) {
          this.dataSource.data = updateDataSource(this.dataSource.data, null, index);
        }
        this.verificarEstados()
      })
    })
  }

  onFinalizar(ventaCredito: VentaCredito, index?, showDialog?): Observable<VentaCredito> {
    return new Observable(obs => {
      if (showDialog != false) {
        this.dialogoService.confirm('Atención!!', 'Realmente desea finalizar este item?', 'Esta acción no se puede deshacer').subscribe(res => {
          this.ventaCreditoService.onFinalizarVentaCredito(ventaCredito.id, ventaCredito.sucursal.id).pipe(untilDestroyed(this)).subscribe(res => {
            if (res == true) {
              ventaCredito.estado = EstadoVentaCredito.FINALIZADO;
              if (index != null) {
                this.dataSource.data = updateDataSource(this.dataSource.data, ventaCredito, index);
              }
              obs.next(ventaCredito);
            } else {
              obs.next(null)
            }
            this.verificarEstados()
          })
        })
      } else {
        this.ventaCreditoService.onFinalizarVentaCredito(ventaCredito.id, ventaCredito.sucursal.id).pipe(untilDestroyed(this)).subscribe(res => {
          if (res == true) {
            ventaCredito.estado = EstadoVentaCredito.FINALIZADO;
            if (index != null) {
              this.dataSource.data = updateDataSource(this.dataSource.data, ventaCredito, index);
            }
            obs.next(ventaCredito);
          } else {
            obs.next(null)
          }
          this.verificarEstados()
        })
      }

    })

  }

  onImprimir(ventaCredito: VentaCredito) {
    this.ventaCreditoService.onImprimirVentaCredito(ventaCredito.id, ventaCredito?.sucursal?.id).pipe(untilDestroyed(this)).subscribe(res => {

    })
  }

  onCobrarTodo() {
    this.selection.clear();
    this.dataSource.data.forEach(row => this.selection.select(row));
    this.onFinalizarSeleccionados();
  }

  onCobrarSeleccion() {
    this.onFinalizarSeleccionados();
  }

  onCobrar(total: number, ventaCreditoList: VentaCredito[]) {
    let data: PagoData = {
      valor: total,
      isCredito: true
    }
    this.dialog.open(PagoTouchComponent,
      {
        data,
        width: "90vw",
        height: "80vh",
      }
    ).afterClosed().subscribe((res: PagoResponseData) => {
      let ventaCreditoInputList: VentaCreditoInput[];
      let cobroDetalleInputList: CobroDetalleInput[];
      ventaCreditoList?.forEach(vc => {
        if (ventaCreditoInputList == null) ventaCreditoInputList = [];
        let aux: VentaCredito = new VentaCredito;
        Object.assign(aux, vc);
        ventaCreditoInputList.push(aux.toInput());
      })
      res.cobroDetalleList.forEach(cd => {
        if (cobroDetalleInputList == null) cobroDetalleInputList = [];
        let aux: CobroDetalle = new CobroDetalle;
        Object.assign(aux, cd);
        cobroDetalleInputList.push(aux.toInput());
      })
      this.ventaCreditoService.onCobrarVentaCredito(ventaCreditoInputList, cobroDetalleInputList).subscribe(saveRes => {
      })
    })
  }

  onVerificarCajaAbierta(): Observable<boolean> {
    return new Observable(obs => {
      this.cajaService.onGetByUsuarioIdAndAbierto(this.mainService.usuarioActual.id, this.mainService.sucursalActual.id).subscribe((res: PdvCaja) => {
        if (res != null) {
          obs.next(true)
        } else {
          obs.next(false)
          this.tabService.addTab(new Tab(VentaTouchComponent, "Venta", null, ListVentaCreditoComponent))
        }
      })
    })
  }

  onImprimirRecibo() {
    let ventaCreditoInputList: VentaCreditoInput[] = [];
    this.selection.selected.forEach(vc => {
      let aux: VentaCredito = new VentaCredito;
      Object.assign(aux, vc);
      ventaCreditoInputList.push(aux.toInput())
    })
    this.ventaCreditoService.onImprimirReporteCobro(this.selectedCliente.id, ventaCreditoInputList, this.mainService.usuarioActual.id);
  }

  onFinalizarSeleccionados() {
    this.dialogoService.confirm('Atención!!', 'Realmente desea finalizar estos itens?', 'Esta acción no se puede deshacer').subscribe(res => {
      const observables = this.selection.selected.map((s: VentaCredito) => this.onFinalizar(s, null, false));
      forkJoin(observables).subscribe(results => {
        this.verificarEstados()
      });
    })
  }


}
