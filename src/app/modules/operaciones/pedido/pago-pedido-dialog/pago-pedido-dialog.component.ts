import { Component, Inject, OnInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { NotaRecepcion } from "../nota-recepcion/nota-recepcion.model";
import { SelectionModel } from "@angular/cdk/collections";
import { Pedido } from "../edit-pedido/pedido.model";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AdicionarClienteData } from "../../../personas/clientes/add-cliente-dialog/add-cliente-dialog.component";
import { NotaRecepcionService } from "../nota-recepcion/nota-recepcion.service";
import { Color, ScaleType } from "@swimlane/ngx-charts";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";

export class PagoPedidoData {
  pedidos: Pedido[];
}

@Component({
  selector: "pago-pedido-dialog",
  templateUrl: "./pago-pedido-dialog.component.html",
  styleUrls: ["./pago-pedido-dialog.component.scss"],
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
export class PagoPedidoDialogComponent implements OnInit {
  selectedPedido: Pedido;
  notaRecepcionDataSource = new MatTableDataSource<NotaRecepcion>([]);
  selectedNotaRecepcion: NotaRecepcion;
  notaRecepcionDisplayedColumns = [
    "select",
    "numero",
    "tipoBoleta",
    "descuento",
    "valor",
    "valorTotal",
    "estado",
  ];
  expandedNotaRecepcionProveedor: NotaRecepcion;
  selectionNotaRecepcion = new SelectionModel<NotaRecepcion>(true, []);
  isAllSelected = false;

  //datos del grafico
  single: any[] = [];
  view: any[] = [700, 400];

  // options
  gradient: boolean = true;
  showLegend: boolean = true;
  showLabels: boolean = true;
  isDoughnut: boolean = false;
  legendPosition: string = "below";

  color: Color;

  colorScheme = {
    domain: ["#43a047", "#f44336", "#363636"],
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PagoPedidoData,
    private notaRecepcionService: NotaRecepcionService
  ) {
    this.color = {
      name: "primary",
      selectable: true,
      domain: this.colorScheme.domain,
      group: ScaleType.Linear,
    };
  }

  ngOnInit(): void {
    // if (this.data != null && this.data.pedido != null) {
    //   this.selectedPedido = this.data.pedido;
    //   this.onBuscarNotaRecepcion();
    // }
  }

  onNotaRecepcionClick(notaRecepcion: NotaRecepcion, index?) {}

  onFilterNotaRecepcion() {}

  onClearFilterNotaRecepcion() {}

  masterToggle() {}

  onBuscarNotaRecepcion(texto?) {
    this.notaRecepcionService
      .onGetNotaRecepcionPorPedidoId(this.selectedPedido.id)
      .subscribe((res) => {
        if (res != null) {
          this.notaRecepcionDataSource.data = res;
          this.onUpdateChart();
        }
      });
  }

  onUpdateChart() {
    this.single = [];
    this.single.push({
      name: "Pagado",
      value: this.selectedPedido?.cantNotasPagadas,
    });
    this.single.push({
      name: "Cancelado",
      value: this.selectedPedido?.cantNotasCanceladas,
    });
    this.single.push({
      name: "Falta pagar",
      value: this.selectedPedido?.cantNotas - this.selectedPedido?.cantNotasPagadas,
    });
  }
}
