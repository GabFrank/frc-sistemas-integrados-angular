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
import { TabData } from "../../../../layouts/tab/tab.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { PdvCaja } from "../../../financiero/pdv/caja/caja.model";
import { CajaService } from "../../../financiero/pdv/caja/caja.service";
import { CajaPorIdGQL } from "../../../financiero/pdv/caja/graphql/cajaPorId";
import { CobroDetalle } from "../cobro/cobro-detalle.model";
import { Venta } from "../venta.model";
import { VentaService } from "../venta.service";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl } from "@angular/forms";

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
  data: TabData;

  ventaDataSource = new MatTableDataSource<Venta>([]);
  ventaDisplayedColumns = ["id", "fecha", "estado", "total"];
  expandedVenta: Venta;
  selectedCaja: PdvCaja;
  loading = false;
  isCargando = false;
  isLastPage = false;
  idVentaControl = new FormControl()

  constructor(
    private cajaService: CajaService,
    private ventaService: VentaService,
    private cargandoService: CargandoDialogService
  ) {}

  ngOnInit(): void {
    if (this.data != null) {
      this.cajaService
        .onGetById(this.data["tabData"]["data"].id).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            this.selectedCaja = res;
            console.log(this.selectedCaja);
            this.onGetVentas();
          }
        });
    }
  }

  onFiltrar(){
    console.log('on filter');
    
    if(this.idVentaControl.value!=null){
      console.log('id is no null');
      
      this.ventaService.onGetPorId(this.idVentaControl.value)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          console.log(res);
          
          this.isLastPage = true;
          if(res!=null && (res?.caja?.id == this.selectedCaja?.id)){
            this.ventaDataSource.data = []
            this.ventaDataSource.data = updateDataSource(this.ventaDataSource.data, res)
          }
        })
    }
  }

  onGetVentas() {
    this.cargandoService.openDialog()
    this.isCargando = true;
    this.ventaService.onSearch(this.selectedCaja.id, this.ventaDataSource.data.length).pipe(untilDestroyed(this)).subscribe((res) => {
      this.cargandoService.closeDialog()
      this.isCargando = false;
      if (res != null) {
        if(res.length < 20) this.isLastPage;
        this.ventaDataSource.data = this.ventaDataSource.data.concat(res);
      }
    });
  }

  onClickRow(venta: Venta, index) {
    if (venta.ventaItemList == null) {
      this.loading = true;
      this.ventaService.onGetPorId(venta.id).pipe(untilDestroyed(this)).subscribe((res) => {
        this.loading = false;
        if (res != null) {
          console.log(res);
          this.ventaDataSource.data[index].ventaItemList = res.ventaItemList;
          this.ventaDataSource.data[index].cobro = res.cobro;
        }
      });
    }
  }

  getCobroTotal(lista: CobroDetalle[], moneda: string): number {
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
}
