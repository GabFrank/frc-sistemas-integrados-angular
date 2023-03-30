import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { Component, Input, OnInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { PdvCaja } from "../../../financiero/pdv/caja/caja.model";
import { CajaService } from "../../../financiero/pdv/caja/caja.service";
import { CajaPorIdGQL } from "../../../financiero/pdv/caja/graphql/cajaPorId";
import { CobroDetalle } from "../cobro/cobro-detalle.model";
import { Venta } from "../venta.model";
import { VentaService } from "../venta.service";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl, FormGroup } from "@angular/forms";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { VentaEstado } from "../enums/venta-estado.enums";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { Tab } from "../../../../layouts/tab/tab.model";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-venta",
  templateUrl: "./list-venta.component.html",
  styleUrls: ["./list-venta.component.scss"],
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
export class ListVentaComponent implements OnInit {
  @Input()
  data: Tab;

  ventaDataSource = new MatTableDataSource<Venta>([]);
  ventaDisplayedColumns = ["id", "modo", "fecha", "estado", "total", "acciones"];
  expandedVenta: Venta;
  selectedCaja: PdvCaja;
  loading = false;
  isCargando = false;
  isLastPage = false;
  idVentaControl = new FormControl()
  formaPagoControl = new FormControl()
  modoControl = new FormControl()
  selectedFormaPago: FormaPago;
  formaPagoList: FormaPago[] = []
  totalRecibidoGs = 0;
  totalRecibido = 0;
  totalRecibidoRs = 0;
  totalDescuento = 0;
  totalRecibidoDs = 0;
  totalAumento = 0;
  totalFinal = 0;
  ventaEstadoList = Object.keys(VentaEstado)
  estadoControl = new FormControl(null)
  filterChanged = true;
  page = 0;
  size = 20;

  form: FormGroup;

  constructor(
    private cajaService: CajaService,
    private ventaService: VentaService,
    private cargandoService: CargandoDialogService,
    private notificacionService: NotificacionSnackbarService,
    private dialogoService: DialogosService,
    private formaPagoService: FormaPagoService,
    private tabService: TabService
  ) { }

  ngOnInit(): void {    
    if (this.data?.tabData?.data != null) {      
      this.selectedCaja = this.data.tabData.data; 
      this.cajaService.onGetById(this.selectedCaja.id, this.selectedCaja.sucursalId).subscribe(res => {
        if(res!=null) this.selectedCaja = res;
      })     
      this.onFiltrar()
    } else {
      this.tabService.removeTab(this.tabService.currentIndex)
    }

    this.formaPagoService.onGetAllFormaPago().subscribe(res => {
      this.formaPagoList = res;
    })

    this.form = new FormGroup({
      'id': this.idVentaControl,
      'formaPago' : this.formaPagoControl,
      'estado' : this.estadoControl
    })

    this.form.valueChanges.subscribe(res => {
      this.filterChanged = true;
      console.log('hola');
      
    })
  }

  onFiltrar() {
    if(this.isLastPage) this.ventaDataSource.data = []
    if (this.idVentaControl.value != null) {
      this.ventaService.onGetPorId(this.idVentaControl.value, this.selectedCaja?.sucursalId)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null && (res?.caja?.id == this.selectedCaja?.id)) {
            this.ventaDataSource.data = []
            this.ventaDataSource.data = updateDataSource(this.ventaDataSource.data, res)
          }
        })
    } else {
      this.onGetVentas()
    }
  }

  onFilterChange(){
    this.filterChanged = true;
  }

   onGetVentas() {
    this.cargandoService.openDialog()
    this.isCargando = true;
    if(this.filterChanged) this.ventaDataSource.data = [];
    this.page = Math.floor(this.ventaDataSource.data.length / this.size);
    this.ventaService.onSearch(this.selectedCaja.id, this.page, this.size, true, this.selectedCaja.sucursalId, this.formaPagoControl.value, this.estadoControl.value, this.modoControl.value).pipe(untilDestroyed(this)).subscribe((res) => {
      this.cargandoService.closeDialog()
      this.isCargando = false;
      if (res != null) {
        this.filterChanged = false;
        this.isLastPage = res.length < 19;
        this.ventaDataSource.data = this.ventaDataSource.data.concat(res);
      }
    });
  }

  onClickRow(venta: Venta, index) {
    if (venta.ventaItemList == null) {
      this.loading = true;
      this.ventaService.onGetPorId(venta.id, venta?.sucursalId).pipe(untilDestroyed(this)).subscribe((res) => {
        this.loading = false;
        if (res != null) {
          this.ventaDataSource.data[index].ventaItemList = res.ventaItemList;
          this.ventaDataSource.data[index].cobro = res.cobro;
          this.getTotales(venta);
        }
      });
    } else {
      this.getTotales(venta);
    }
  }

  getTotales(venta: Venta) {
    console.log(venta.cobro.cobroDetalleList);

    this.totalRecibidoGs = 0;
    this.totalRecibidoRs = 0;
    this.totalRecibidoDs = 0;
    this.totalAumento = 0;
    this.totalDescuento = 0;
    this.totalFinal = 0;
    this.totalRecibido = 0;

    venta?.cobro?.cobroDetalleList.forEach(res => {
      if (res.moneda.denominacion == 'GUARANI') {
        if (res.pago || res.vuelto) {
          this.totalRecibidoGs += res.valor;
          this.totalRecibido += res.valor;
          this.totalFinal += res.valor;
        } else if (res.aumento) { 
          this.totalAumento += res.valor;
          this.totalFinal += res.valor;
        } 
        else if (res.descuento) this.totalDescuento += res.valor

      } else if (res.moneda.denominacion == 'REAL') {
        if (res.pago || res.vuelto) {
          this.totalRecibidoRs += res.valor
          this.totalRecibido += (res.valor * res.cambio)
          this.totalFinal += (res.valor * res.cambio)
        }
      } else if (res.moneda.denominacion == 'DOLAR') {
        if (res.pago || res.vuelto) {
          this.totalRecibidoDs += res.valor
          this.totalRecibido += (res.valor * res.cambio)
          this.totalFinal += (res.valor * res.cambio)
        }
      }
    })
  }

  getCobroTotal(lista: CobroDetalle[], moneda: string): number {
    console.log('cargando');

    let total = 0;
    lista?.forEach((c) => {
      if (c.moneda.denominacion == moneda && (c.pago || c.vuelto) && !c.aumento)
        total += c.valor;
    });
    return total;
  }

  getCobroTotalGeneral(
    lista: CobroDetalle[],
    descuento?: boolean,
    aumento?: boolean
  ): number {
    let total = 0;
    lista?.forEach((c) => {
      if (descuento && !c.aumento) {
        if (c.descuento) total += c.valor;
      } else if ((c.pago || c.vuelto) && !c.aumento) total += c.valor * c.cambio;
    });
    return total;
  }

  getCobroTotalFinal(lista: CobroDetalle[]): number {
    let total = 0;
    lista?.forEach((c) => {
      if (c.aumento) {
        // total -= c.valor * c.cambio;
      } else {
        total += c.valor * c.cambio;
      }
      // if (c.descuento) total -= c.valor * c.cambio;
    });
    return total;
  }

  onCancelarVenta(venta: Venta, index: number) {
    this.dialogoService.confirm("Atención!!", "Realmente desea cancelar esta venta?").subscribe(res => {
      if (res) {
        this.ventaService.onCancelarVenta(venta.id, venta.sucursalId).subscribe(res1 => {
          if (res1) {
            this.notificacionService.openSucess("Venta cancelada con éxito");
            venta.estado = VentaEstado.CANCELADA
            this.ventaDataSource.data = updateDataSource(this.ventaDataSource.data, venta, index)
            this.ngOnInit()
          } else {
            this.notificacionService.openAlgoSalioMal("Ups! No se pudo cancelar la venta. ");
          }
        })
      }
    })
  }

  onResetFiltro(){
    this.idVentaControl.setValue(null)
    this.formaPagoControl.setValue(null)
    this.estadoControl.setValue(null)
    this.selectedFormaPago = null;
    this.ventaDataSource.data = []
  }
}
