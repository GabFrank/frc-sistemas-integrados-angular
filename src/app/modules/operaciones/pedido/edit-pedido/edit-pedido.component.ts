import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatDatepicker } from "@angular/material/datepicker";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { forkJoin } from "rxjs";
import { PageInfo } from "../../../../app.component";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import {
  CurrencyMask,
  updateDataSource,
  updateDataSourceWithId,
} from "../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { MainService } from "../../../../main.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { FrcSearchableSelectComponent } from "../../../../shared/components/frc-searchable-select/frc-searchable-select.component";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { MonedaService } from "../../../financiero/moneda/moneda.service";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { ProveedorService } from "../../../personas/proveedor/proveedor.service";
import { Vendedor } from "../../../personas/vendedor/vendedor.model";
import { VendedorService } from "../../../personas/vendedor/vendedor.service";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { ProductoProveedor } from "../../../productos/producto-proveedor/producto-proveedor.model";
import { ProductoProveedorService } from "../../../productos/producto-proveedor/producto-proveedor.service";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import { CompraItem } from "../../compra/compra-item.model";
import { CompraService } from "../../compra/compra.service";
import { CostoPorProductoService } from "../../costo-por-producto/costo-por-producto.service";
import { PedidoService } from "../pedido.service";
import { PedidoEstado } from "./pedido-enums";
import { PedidoItem } from "./pedido-item.model";
import { Pedido } from "./pedido.model";
import { TipoBoleta } from "../../compra/compra-enums";
import { NotaRecepcion } from "../nota-recepcion/nota-recepcion.model";
import {
  AdicionarNotaRecepcionData,
  AdicionarNotaRecepcionDialogComponent,
} from "../nota-recepcion/adicionar-nota-recepcion-dialog/adicionar-nota-recepcion-dialog.component";
import { SelectionModel } from "@angular/cdk/collections";
import { extractIds } from "../../../../commons/core/utils/arraysUtil";
import { Color, ScaleType } from "@swimlane/ngx-charts";
import { DividirItemDialogComponent } from "../dividir-item-dialog/dividir-item-dialog.component";

export interface ProductoDelProveedor {
  id: number;
  proveedor: string;
  producto: any;
  stockTotal: number;
  stockPorSucursal: any[];
  sugeridoTotal: number;
  sugeridoPorSucursal: any[];
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-edit-pedido",
  templateUrl: "./edit-pedido.component.html",
  styleUrls: ["./edit-pedido.component.scss"],
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
export class EditPedidoComponent implements OnInit, AfterViewInit {
  //Inputs de los elementos
  @ViewChild("proveedorInput", { static: false }) proveedorInput: ElementRef;
  @ViewChild("vendedorInput", { static: false }) vendedorInput: ElementRef;
  @ViewChild("sucursalSelect", { static: false, read: MatSelect })
  sucursalSelect: MatSelect;
  @ViewChild("sucursalEntregaSelect", { static: false, read: MatSelect })
  sucursalEntregaSelect: MatSelect;
  @ViewChild("presentacionSelect", { static: false, read: MatSelect })
  presentacionSelect: MatSelect;
  @ViewChild("autoMonedaInput", { static: false, read: MatAutocompleteTrigger })
  matMonedaTrigger: MatAutocompleteTrigger;
  @ViewChild("autoMonedaInput", { static: false })
  autoMonedaInput: ElementRef;
  @ViewChild("diasCreditoInput", { static: false })
  diasCreditoInput: ElementRef;
  @ViewChild("formaPagoSelect", { read: FrcSearchableSelectComponent })
  formaPagoSelect: FrcSearchableSelectComponent;
  @ViewChild("monedaSelect", { read: FrcSearchableSelectComponent })
  monedaSelect: FrcSearchableSelectComponent;
  @ViewChild("picker") picker: MatDatepicker<Date>;
  @ViewChild("codigoInput", { static: false }) codigoInput: ElementRef;
  @ViewChild("cantidadPresentacionInput", { static: false })
  cantidadPresentacionInput: ElementRef;
  @ViewChild("cantidadUnidadInput", { static: false })
  cantidadUnidadInput: ElementRef;

  //datos del proveedor
  selectedProveedor: Proveedor;

  //datos del vendedor
  selectedVendedor: Vendedor;
  vendedorList: Vendedor[];

  //Controles del formulario
  pedidoFormGroup: FormGroup;
  pedidoItemFormGroup: FormGroup;
  idControl = new FormControl(null);
  buscarProveedorControl = new FormControl(null, Validators.required);
  buscarVendedorControl = new FormControl(null, Validators.required);
  sucursalInfluenciaControl = new FormControl(null);
  sucursalEntregaControl = new FormControl(null);
  tipoBoletaControl = new FormControl("LEGAL");
  diasCreditoControl = new FormControl(null);
  fechaEntregaControl = new FormControl(null);
  fechaEntregaDisplayControl = new FormControl(null);
  codigoControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl(null);
  presentacionControl = new FormControl(null);
  cantidadUnidadControl = new FormControl(null);
  cantidadPresentacionControl = new FormControl(null);
  formaPagoControl = new FormControl(null);
  precioPorPresentacionControl = new FormControl(null);
  precioUnitarioControl = new FormControl(null);
  monedaControl = new FormControl(null);
  buscarProductoProveedor = new FormControl();

  selectedMoneda: Moneda;
  selectedFormaPago: FormaPago;

  //Listas
  presentacionList: Presentacion[];
  sucursalList: Sucursal[];
  tipoBoletaList: any[] = ["LEGAL", "COMUN", "AMBAS"];
  formaPagoList: FormaPago[];
  monedas: Moneda[];
  auxMonedas: Moneda[];

  //datos de sucursales
  sucursalInfluenciaSelect: any;

  //datos de tabla Productos del Proveedor
  expandedProductoProveedor: any;
  productosProveedorDataSource = new MatTableDataSource<ProductoProveedor>([]);
  filteredProductosProveedorDataSource =
    new MatTableDataSource<ProductoProveedor>([]);
  productoProveedorDisplayedColumns = ["codigo", "descripcion", "menu"];

  //datos de tabla de historico de precios
  expandedcompraItem: any;
  historicoCompraItemDataSource = new MatTableDataSource<CompraItem>([]);
  compraItemDisplayedColumns = [
    "fecha",
    "presentacion",
    "cantidad",
    "precio",
    "menu",
  ];
  pageCompraItem: number = 0;
  sizeCompraItem: number = 10;

  //datos de tabla de itens del pedido
  expandedPedido: PedidoItem;
  expandedPedidoItemNotaRecepcion: PedidoItem;
  pedidoDataSource = new MatTableDataSource<any>([]);
  pedidoItemNotaRecepcionDataSource = new MatTableDataSource<any>([]);
  pedidoDisplayedColumns = [
    "codigo",
    "descripcion",
    "presentacion",
    "cantidad",
    "precioUnitario",
    "precioPresentacion",
    // "descuentoPresentacion",
    "total",
    "menu",
    "delete",
  ];
  pedidoItemNotaRecepcionDisplayedColumns = [
    "codigo",
    "descripcion",
    "presentacion",
    "cantidad",
    "precioUnitario",
    "precioPresentacion",
    // "descuentoPresentacion",
    "total",
    "menu",
    "delete",
  ];
  selection = new SelectionModel<PedidoItem>(true, []);
  selectionNotaRecepcion = new SelectionModel<PedidoItem>(true, []);
  selectedPedidoItemNotaRecepcion: PedidoItem;
  selectedPedidoItemNotaRecepcionPage: PageInfo<PedidoItem>;
  pedidoItemNotaRecepcionPageIndex = 0;
  pedidoItemNotaRecepcionPageSize = 10;
  //datos de fecha de entrega
  initialDates: Date[] = []; // Example initial dates

  //datos del producto
  isPesable = false;
  selectedProducto: Producto;

  //flags de control
  isDialogOpen = false;

  //mascara para formatear los numeros a monedas
  currencyMask = new CurrencyMask();

  col1 = 35;
  col2 = 65;
  r1 = 50;
  r2 = 50;

  productoProveedorPageIndex = 0;
  productoProveedorPageSize = 10;
  selectedProductoProveedorPage: PageInfo<ProductoProveedor>;

  compraItemPageIndex = 0;
  compraItemPageSize = 10;
  selectedcompraItemPage: PageInfo<CompraItem>;

  //Datos del pedido
  selectedPedido: Pedido;
  selectedPedidoItem: PedidoItem;

  //Paginacion
  page = 0;
  size = 15;
  selectedPedidoItemPage: PageInfo<PedidoItem>;

  @Input()
  data: Tab;

  //variable que indica si esta en estado de editar el pedido
  isEditing = true;

  totalCost = 0;

  //datos de nota recepcion
  notaRecepcionDataSource = new MatTableDataSource<NotaRecepcion>([]);
  selectedNotaRecepcion: NotaRecepcion;
  notaRecepcionDisplayedColumns = [
    "numero",
    "tipoBoleta",
    "cantidadItem",
    "valorTotal",
    "menu",
  ];
  expandedNotaRecepcionProveedor: NotaRecepcion;
  isAddingItensToNota = false;
  totalItensAgregados = 0;

  valorTotalControl = new FormControl(null);
  descuentoPresentacionControl = new FormControl(null);
  selectedHistoricoCompraPage: PageInfo<CompraItem>;

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
    domain: ["#43a047", "#363636"],
  };

  constructor(
    private proveedorService: ProveedorService,
    private vendedorService: VendedorService,
    private dialog: MatDialog,
    private cargandoService: CargandoDialogService,
    private sucursalService: SucursalService,
    private monedaService: MonedaService,
    public formaPagoService: FormaPagoService,
    private productoService: ProductoService,
    private matDialog: MatDialog,
    private costoPorProducoService: CostoPorProductoService,
    private compraService: CompraService,
    private productoProveedorService: ProductoProveedorService,
    private pedidoService: PedidoService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {
    this.color = {
      name: "primary",
      selectable: true,
      domain: this.colorScheme.domain,
      group: ScaleType.Linear,
    };
  }

  ngOnInit(): void {
    this.pedidoFormGroup = new FormGroup({
      proveedoor: this.buscarProveedorControl,
      vendedor: this.buscarVendedorControl,
      formaPago: this.formaPagoControl,
      moneda: this.monedaControl,
      sucursalInfluencia: this.sucursalInfluenciaControl,
      sucursalEntrega: this.sucursalEntregaControl,
      tipoBoleta: this.tipoBoletaControl,
      diasCredito: this.diasCreditoControl,
      fechaEntrega: this.fechaEntregaControl,
    });
    this.pedidoItemFormGroup = new FormGroup({
      codigo: this.codigoControl,
      presentacion: this.presentacionControl,
      cantidadUnidad: this.cantidadUnidadControl,
      cantidadPresentacion: this.cantidadPresentacionControl,
      precioPorPresentacion: this.precioPorPresentacionControl,
      precioUnitario: this.precioUnitarioControl,
      valorTotal: this.valorTotalControl,
      descuentoPresentacion: this.descuentoPresentacionControl,
    });

    forkJoin({
      sucursales: this.sucursalService
        .onGetAllSucursales()
        .pipe(untilDestroyed(this)),
      monedas: this.monedaService.onGetAll().pipe(untilDestroyed(this)),
      formasPago: this.formaPagoService
        .onGetAllFormaPago()
        .pipe(untilDestroyed(this)),
    }).subscribe({
      next: ({ sucursales, monedas, formasPago }) => {
        this.sucursalList = sucursales.filter((s) => s.deposito == true);
        this.monedas = monedas;
        this.auxMonedas = monedas;
        this.formaPagoList = formasPago;

        // Call someFunc() here, it will execute after all operations are finished
        if (this.data?.tabData?.id != null) {
          this.pedidoService
            .onGetPedidoInfoCompleta(this.data.tabData.id)
            .pipe(untilDestroyed(this))
            .subscribe((pedidoRes) => {
              this.onCargarDatos(pedidoRes);
            });
        }
      },
      error: (error) => {
        // Handle errors
      },
    });

    this.cantidadPresentacionControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!isNaN(+res)) {
          if (this.presentacionControl?.value?.cantidad != null) {
            this.cantidadUnidadControl.setValue(
              res * this.presentacionControl?.value?.cantidad
            );
          }
        }
      });

    this.precioPorPresentacionControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!isNaN(+res)) {
          if (this.presentacionControl?.value?.cantidad != null) {
            this.precioUnitarioControl.setValue(
              res / this.presentacionControl?.value?.cantidad,
              { emitEvent: false }
            );
            this.valorTotalControl.setValue(
              this.precioPorPresentacionControl.value *
                this.cantidadPresentacionControl.value
            );
          }
        }
      });

    this.precioUnitarioControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!isNaN(+res)) {
          if (this.presentacionControl?.value?.cantidad != null) {
            this.precioPorPresentacionControl.setValue(
              res * this.presentacionControl?.value?.cantidad,
              { emitEvent: false }
            );
            this.valorTotalControl.setValue(
              this.precioPorPresentacionControl.value *
                this.cantidadPresentacionControl.value
            );
          }
        }
      });

    this.presentacionControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        let aux = this.precioUnitarioControl.value;
        this.precioUnitarioControl.setValue(aux);
      });

    this.fechaEntregaControl.valueChanges.subscribe((res) => {
      // console.log(res);
    });

    // this.descuentoPresentacionControl.valueChanges.subscribe(res => {
    //   this.valorTotalControl.setValue(this.valorTotalControl.value - this.descuentoPresentacionControl.value);
    // })
  }

  onCargarDatos(pedido: Pedido) {
    this.selectedPedido = new Pedido();
    Object.assign(this.selectedPedido, pedido);

    if (pedido == null) {
      this.cambiarEstado(true);
    } else {
      this.cambiarEstado(false);
    }

    this.idControl.setValue(pedido?.id);
    if (pedido.proveedor != null) {
      this.onSelectProveedor(pedido.proveedor);
    }
    if (pedido.vendedor != null) {
      this.vendedorList = [pedido.vendedor];
      this.onSelectVendedor(pedido.vendedor);
    }

    let sucursalInfluenciaList = pedido.sucursalInfluenciaList?.map(
      (sucursalInfluencia) => sucursalInfluencia.sucursal
    );

    this.sucursalInfluenciaControl.setValue(
      this.sucursalList?.filter((s) =>
        sucursalInfluenciaList?.map((s2) => s2.id)?.includes(s.id)
      )
    );

    let sucursalEntregaList = pedido.sucursalEntregaList?.map(
      (sucursalEntrega) => sucursalEntrega.sucursal
    );

    let pedidoFechaEntregaList: Date[] = pedido.fechaEntregaList?.map(
      (fechaEntrega) => new Date(fechaEntrega.fechaEntrega)
    );

    this.sucursalEntregaControl.setValue(
      this.sucursalList?.filter((s) =>
        sucursalEntregaList?.map((s2) => s2.id)?.includes(s.id)
      )
    );

    this.notaRecepcionDataSource.data = pedido?.notaRecepcionList;

    this.notaRecepcionDataSource.data.forEach((res) => {
      this.totalItensAgregados = this.totalItensAgregados + res.cantidadItens;
    });

    if (this.selectedPedido?.cantPedidoItem > 0) {
      if (this.totalItensAgregados > 0) {
        this.single.push({
          name: "Agregado",
          value: this.totalItensAgregados,
        });
      }
      this.single.push({
        name: "Falta",
        value: this.selectedPedido?.cantPedidoItem - this.totalItensAgregados,
      });
    }

    this.tipoBoletaControl.setValue(
      this.tipoBoletaList.find((tipo) => tipo.toString() == pedido.tipoBoleta)
    );

    this.handleFormaPagoSelectionChange(
      this.formaPagoList.find((forma) => forma.id == pedido?.formaPago?.id)
    );

    this.handleMonedaSelectionChange(
      this.monedas.find((moneda) => moneda.id == pedido.moneda.id)
    );

    this.diasCreditoControl.setValue(pedido.plazoCredito);

    if (pedidoFechaEntregaList?.length > 0) {
      this.initialDates = pedidoFechaEntregaList;
    }

    this.totalCost = this.selectedPedido.valorTotal;

    // console.log(this.selectedPedido);

    if (this.selectedPedido.estado == PedidoEstado.ABIERTO) {
      this.pedidoItemFormGroup.enable();
    } else {
      this.pedidoItemFormGroup.disable();
    }

    this.onBuscarItens(pedido);
  }

  onBuscarItens(pedido: Pedido) {
    if (pedido.estado === PedidoEstado.ABIERTO) {
      this.buscarPedidoItens();
    } else {
      this.buscarPedidoItemSobrantes();
    }
  }

  buscarPedidoItens() {
    this.pedidoService
      .onGetPedidoItemPorPedido(this.selectedPedido.id, this.page, this.size)
      .pipe(untilDestroyed(this))
      .subscribe((res: PageInfo<PedidoItem>) => {
        this.selectedPedidoItemPage = res;
        this.pedidoDataSource.data = res.getContent;
      });
  }

  buscarPedidoItensPorNotaRecepcion(id) {
    this.pedidoService
      .onGetPedidoItemPorNotaRecepcion(id, this.page, this.size)
      .pipe(untilDestroyed(this))
      .subscribe((res: PageInfo<PedidoItem>) => {
        this.selectedPedidoItemNotaRecepcionPage = res;
        this.pedidoItemNotaRecepcionDataSource.data = res.getContent;
      });
  }

  ngAfterViewInit(): void {
    this.cargandoService.openDialog();
    setTimeout(() => {
      this.proveedorInput.nativeElement.focus();
      this.cargandoService.closeDialog();
    }, 1000);
  }

  /*Esta funcion buscara un proveedor de acuerdo al texto ingresado
  si el texto es vacio, entonces abrira el dialogo de buscar proveedores
  si el texto contiene el codigo (ID) del proveedor, se buscara por ID, 
  si se encuentra 1 proveedor, se cargara automaticamente, si no se encuentra abrira el dialogo de buscar proveedores
  si el texto contiene un string, se abrira el dialogo de buscar proveedor filtrado por ese string
  */
  onBuscarProveedor() {
    if (this.buscarProveedorControl.valid) {
      //verificar si se ingreso algun texto en el buscador
      let texto: string = this.buscarProveedorControl.value;
      if (!isNaN(+texto)) {
        //verificar si el texto es un numero (ID)
        this.proveedorService
          .onGetPorId(+texto)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            this.onSelectProveedor(res);
          });
      } else if (
        this.selectedProveedor != null &&
        texto.includes(this.selectedProveedor.persona.nombre)
      ) {
        this.vendedorInput.nativeElement.focus();
      } else {
        this.onSearchProveedorPorTexto();
      }
    } else {
      this.onSearchProveedorPorTexto();
    }
  }

  onSearchProveedorPorTexto() {
    let tableData: TableData[] = [
      {
        id: "id",
        nombre: "Id",
      },
      {
        id: "nombre",
        nombre: "Nombre",
        nested: true,
        nestedId: "persona",
      },
      {
        id: "documento",
        nombre: "RUC/CI",
        nested: true,
        nestedId: "persona",
      },
    ];
    let data: SearchListtDialogData = {
      query: this.proveedorService.proveedorSearch,
      tableData: tableData,
      titulo: "Buscar proveedor",
      search: true,
      texto: this.buscarProveedorControl.value,
      inicialSearch: this.buscarProveedorControl.valid,
    };
    this.dialog
      .open(SearchListDialogComponent, {
        data: data,
        width: "60%",
        height: "80%",
      })
      .afterClosed()
      .subscribe((res: Proveedor) => {
        if (res != null) {
          this.onSelectProveedor(res);
        }
      });
  }

  /*
  Funcion en donde pasamos el proveedor encontrado
  */
  onSelectProveedor(proveedor: Proveedor) {
    if (proveedor != null) {
      this.vendedorList = proveedor?.vendedores;
      this.selectedProveedor = proveedor;
      this.buscarProveedorControl.setValue(
        this.selectedProveedor.id +
          " - " +
          this.selectedProveedor.persona.nombre
      );

      this.vendedorInput?.nativeElement.focus();

      this.productoProveedorService
        .getByProveedorId(
          proveedor.id,
          null,
          this.productoProveedorPageIndex,
          this.productoProveedorPageSize
        )
        .pipe(untilDestroyed(this))
        .subscribe((res: PageInfo<ProductoProveedor>) => {
          this.selectedProductoProveedorPage = res;
          this.productosProveedorDataSource.data = res.getContent;
        });
    } else {
      this.vendedorList = null;
      this.selectedProveedor = null;
      this.buscarProveedorControl.setValue(null, { emitEvent: false });
      this.vendedorInput.nativeElement.focus();
    }
  }

  onFiltrarProductoProveedor() {
    this.productoProveedorService
      .getByProveedorId(
        this.selectedProveedor.id,
        this.buscarProductoProveedor.value,
        this.productoProveedorPageIndex,
        this.productoProveedorPageSize
      )
      .pipe(untilDestroyed(this))
      .subscribe((res: PageInfo<ProductoProveedor>) => {
        this.selectedProductoProveedorPage = res;
        this.productosProveedorDataSource.data = res.getContent;
      });
  }

  onClearProveedor() {
    this.onSelectProveedor(null);
    this.productosProveedorDataSource.data = [];
    this.historicoCompraItemDataSource.data = [];
  }

  /*
  si hay un proveedor seleccionado, al buscar un vendedor va a filtrar por proveedor, o sea
  va a buscar todos los vendedores vinculados con el proveedor
   */
  onBuscarVendedor() {
    this.onSearchVendedorPorTexto();
  }

  onSearchVendedorPorTexto() {
    let tableData: TableData[] = [
      {
        id: "id",
        nombre: "Id",
      },
      {
        id: "nombre",
        nombre: "Nombre",
        nested: true,
        nestedId: "persona",
      },
      {
        id: "documento",
        nombre: "RUC/CI",
        nested: true,
        nestedId: "persona",
      },
    ];
    let data: SearchListtDialogData = {
      query: this.vendedorService.vendedorSearch,
      tableData: tableData,
      titulo: "Buscar vendedor",
      search: false,
      texto: this.buscarVendedorControl.value,
      inicialSearch: false,
      inicialData: this.vendedorList,
    };
    this.dialog
      .open(SearchListDialogComponent, {
        data: data,
        width: "60%",
        height: "80%",
      })
      .afterClosed()
      .subscribe((res: Vendedor) => {
        if (res != null) {
          this.onSelectVendedor(res);
        }
      });
  }

  onSelectVendedor(vendedor: Vendedor, focus = true) {
    if (vendedor != null) {
      this.selectedVendedor = vendedor;
      this.buscarVendedorControl.setValue(
        this.selectedVendedor.id + " - " + this.selectedVendedor.persona.nombre
      );
      this.sucursalSelect.focus();
    } else {
      this.selectedVendedor = null;
      this.buscarVendedorControl.setValue(null, { emitEvent: false });
      focus ? this.vendedorInput.nativeElement.focus() : null;
    }
  }

  onClearVendedor(focus = true) {
    this.onSelectVendedor(null, focus);
  }

  onMonedaSearch(a?): void {
    let texto;
    a == null ? (texto = this.monedaControl.value) : (texto = a);
    let filteredMonedas = this.monedas.filter((m) => {
      if (m.id == +texto || m.denominacion.match(/.*i.*/)) {
        return m;
      }
    });
    if (filteredMonedas.length == 1) {
      setTimeout(() => {
        this.monedaControl.setValue(filteredMonedas[0].id);
        this.setFocusToValorInput();
        this.matMonedaTrigger.closePanel();
      }, 1000);
    }
  }

  setFocusToValorInput() {}

  displayMoneda(value?: number) {
    let res = value ? this.monedas?.find((_) => _.id === value) : undefined;
    this.selectedMoneda = res;
    this.setFocusToValorInput();
    return res ? res.id + " - " + res.denominacion : undefined;
  }

  onFormaPagoEnter() {
    // if()
  }

  onMonedaAutoClosed() {}

  onSaveItem() {
    let newData = true;
    if (this.selectedPedido?.id == null) return null;
    if (this.selectedPedidoItem == null) {
      this.selectedPedidoItem = new PedidoItem();
    } else {
      newData = false;
    }
    this.selectedPedidoItem.pedido = this.selectedPedido;
    this.selectedPedidoItem.producto = this.selectedProducto;
    this.selectedPedidoItem.presentacion = this.presentacionControl.value;
    this.selectedPedidoItem.cantidad = this.cantidadPresentacionControl.value;
    this.selectedPedidoItem.precioUnitario = this.precioUnitarioControl.value;
    this.selectedPedidoItem.descuentoUnitario =
      this.descuentoPresentacionControl.value /
      this.selectedPedidoItem.presentacion.cantidad;
    this.selectedPedidoItem.valorTotal =
      this.cantidadPresentacionControl.value *
      (this.precioPorPresentacionControl.value -
        this.descuentoPresentacionControl.value);
    // this.selectedPedidoItem.vencimiento = this.vencimientoControl.value;
    // this.selectedPedidoItem.bonificacion = this.bonificacionControl.value;

    this.pedidoService
      .onSaveItem(this.selectedPedidoItem.toInput())
      .pipe(untilDestroyed(this))
      .subscribe((pedidoItemRes) => {
        if (pedidoItemRes != null) {
          this.onClearItem();
          if (newData) {
            this.selectedPedidoItemPage.getContent.unshift(pedidoItemRes);
            this.selectedPedidoItemPage.getNumberOfElements++;
            this.selectedPedidoItemPage.getTotalElements++;
            this.pedidoDataSource.data = this.selectedPedidoItemPage.getContent;
          } else {
            this.selectedPedidoItemPage.getContent = updateDataSourceWithId(
              this.selectedPedidoItemPage.getContent,
              this.selectedPedidoItem,
              this.selectedPedidoItem?.id
            );
            this.pedidoDataSource.data = this.selectedPedidoItemPage.getContent;
          }
          // console.log(this.selectedPedido);

          this.selectedPedido.valorTotal = pedidoItemRes.pedido.valorTotal;
          this.selectedPedido.descuento = pedidoItemRes.pedido.descuento;
        }
      });
  }
  onClearItem() {
    this.selectedProducto = null;
    this.codigoControl.setValue(null);
    this.presentacionControl.setValue(null);
    this.cantidadPresentacionControl.setValue(null);
    this.cantidadUnidadControl.setValue(null);
    this.precioPorPresentacionControl.setValue(0);
    this.precioUnitarioControl.setValue(0);
    this.valorTotalControl.setValue(0);
    this.descuentoPresentacionControl.setValue(0);
  }

  handleFormaPagoSelectionChange(value) {
    this.formaPagoControl.setValue(value);
    this.selectedFormaPago = value;
    if (this.selectedFormaPago.descripcion.includes("TARJETA")) {
      this.monedas = this.auxMonedas.filter((m) =>
        m.denominacion.includes("GUARANI")
      );
    } else if (this.selectedFormaPago.descripcion.includes("PIX")) {
      this.monedas = this.auxMonedas.filter((m) =>
        m.denominacion.includes("REAL")
      );
    } else {
      this.monedas = this.auxMonedas;
    }
  }

  handleMonedaSelectionChange(value: any) {
    this.monedaControl.setValue(value);
    this.selectedMoneda = value;
  }

  handleDatesChanged(dates: Date[]) {
    this.fechaEntregaControl.setValue(dates);
  }

  onMasOpciones() {}

  onSearchPorCodigo() {
    if (this.codigoControl.valid) {
      let text = this.codigoControl.value;
      this.isPesable = false;
      let peso;
      let codigo;
      if (text.length == 13 && text.substring(0, 2) == "20") {
        this.isPesable = true;
        codigo = text.substring(2, 7);
        peso = +text.substring(7, 12) / 1000;
        text = codigo;
        this.cantidadUnidadControl.enable();
        this.cantidadPresentacionControl.setValue(peso);
        this.cantidadUnidadControl.setValue(peso);
        this.cantidadPresentacionControl.disable();
        this.cantidadUnidadControl.disable();
        this.presentacionControl.disable();
      } else {
        this.cantidadPresentacionControl.enable();
        this.presentacionControl.enable();
      }
      this.productoService.onGetProductoPorCodigo(text).subscribe((res) => {
        if (res != null) {
          this.onSelectProducto(res);
        } else {
          this.onAddItem(this.codigoControl.value);
        }
      });
    } else {
      this.onAddItem();
    }
  }

  onSelectProducto(producto: Producto, openPresentacion = true) {
    this.selectedProducto = producto;
    this.onSearchCompraItems(this.selectedProducto);
    this.codigoControl.setValue(
      `${this.selectedProducto?.id} - ${this.selectedProducto?.descripcion}`
    );
    this.precioUnitarioControl.setValue(
      this.selectedProducto?.costo?.ultimoPrecioCompra
    );
    if (this.selectedProducto?.presentaciones?.length == 1) {
      this.presentacionControl.setValue(
        this.selectedProducto.presentaciones[0],
        { emitEvent: openPresentacion }
      );
      if (!this.isPesable) {
        this.cantidadPresentacionControl.setValue(1);
        this.cantidadUnidadControl.setValue(
          this.presentacionControl.value?.cantidad
        );
      }
      this.cantidadPresentacionInput.nativeElement.select();
    } else if (this.selectedProducto?.presentaciones?.length > 1) {
      this.presentacionControl.setValue(
        this.selectedProducto.presentaciones[0],
        { emitEvent: openPresentacion }
      );
      this.presentacionSelect.focus();
      this.presentacionSelect.open();
    } else {
    }
  }

  onSearchCompraItems(producto: Producto) {
    this.compraService
      .getItemPorProductoId(producto.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null || res?.length != 0) {
          this.historicoCompraItemDataSource.data = res;
        } else {
          this.historicoCompraItemDataSource.data = [];
        }
      });
  }

  onCodigoFocus() {
    this.codigoInput.nativeElement.select();
  }

  onAddItem(texto?) {
    this.isDialogOpen = true;
    let data: PdvSearchProductoData = {
      texto: texto,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
    };
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: data,
        height: "80%",
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        let response: PdvSearchProductoResponseData = res;
        this.selectedProducto = response.producto;
        this.onSearchCompraItems(this.selectedProducto);
        this.codigoControl.setValue(
          `${this.selectedProducto?.id} - ${this.selectedProducto?.descripcion}`
        );
        this.precioUnitarioControl.setValue(
          this.selectedProducto?.costo?.ultimoPrecioCompra
        );
        this.presentacionControl.setValue(response.presentacion);
        this.cantidadPresentacionControl.setValue(1);
        // let codigo = response.presentacion?.codigoPrincipal?.codigo;
        // if (codigo == null) codigo = response.producto.codigoPrincipal;
        // this.codigoControl.setValue(codigo)
        // let foundItem = this.dataSource.data?.find(t => t.presentacionPreTransferencia?.producto?.id == this.presentacionControl.value?.producto?.id)
        // if (foundItem != null) {
        //   this.dialogoService.confirm("Ya existe un producto cargado en la lista", "Desea editar el item?").subscribe(dialogRes => {
        //     if (dialogRes) {
        //       this.onEditItem(foundItem)
        //     }
        //   })
        // }
        setTimeout(() => {
          this.cantidadPresentacionInput.nativeElement.select();
        }, 100);
      });
  }

  onBuscarProductoProveedor() {
    this.onFiltrarProductoProveedor();
  }

  onResizeEnd(e) {
    let widthFactor = e.rectangle.width / 100;
    let heightFactor = e.rectangle.height / 100;
    let resizeR = e.edges.right;
    let resizeH = e.edges.top;
    let factorR = Math.round(resizeR / widthFactor);
    let factorH = Math.round(resizeH / heightFactor);
    if (!isNaN(factorR)) {
      this.col1 = this.col1 + factorR;
      this.col2 = this.col2 + factorR * -1;
    }
    if (!isNaN(factorH)) {
      this.r1 = this.r1 + factorH;
      this.r2 = this.r2 + factorH * -1;
    }
  }

  onResizeStart(e) {
    // console.log(e);
  }

  onProductoProveedorItemClick(productoProveedor: ProductoProveedor, i) {
    this.productoService
      .getProducto(productoProveedor.producto.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.onClearItem();
          this.onSelectProducto(res);
        }
      });
  }

  productoProveedorHandlePageEvent(e: PageEvent) {
    this.productoProveedorPageIndex = e.pageIndex;
    this.productoProveedorPageSize = e.pageSize;
    this.onFiltrarProductoProveedor();
  }

  pedidoItemNotaRecepcionHandlePageEvent(e: PageEvent) {
    this.pedidoItemNotaRecepcionPageIndex = e.pageIndex;
    this.pedidoItemNotaRecepcionPageSize = e.pageSize;
  }

  onRepetirPedido(compraItem: CompraItem, index) {
    // this.presentacionControl.setValue(this.selectedProducto.presentaciones.find(p => p.id == compraItem.presentacion.id))
  }

  /*
  Metodo para guardar el pedido
  */
  onGuardar() {
    if (this.selectedPedido == null) {
      this.selectedPedido = new Pedido();
      this.selectedPedido.estado = PedidoEstado.ABIERTO;
      this.selectedPedido.usuario = this.mainService.usuarioActual;
    }
    this.selectedPedido.proveedor = this.selectedProveedor;
    this.selectedPedido.vendedor = this.selectedVendedor;
    this.selectedPedido.moneda = this.selectedMoneda;
    this.selectedPedido.formaPago = this.selectedFormaPago;
    this.selectedPedido.plazoCredito = this.diasCreditoControl.value;
    this.selectedPedido.tipoBoleta = this.tipoBoletaControl.value;

    this.pedidoService
      .onSaveFull(
        this.selectedPedido.toInput(),
        this.fechaEntregaControl.value?.map((entity: Date) =>
          dateToString(entity)
        ),
        this.sucursalEntregaControl.value?.map((entity: Sucursal) => entity.id),
        this.sucursalInfluenciaControl.value?.map(
          (entity: Sucursal) => entity.id
        ),
        this.mainService.usuarioActual.id
      )
      .pipe(untilDestroyed(this))
      .subscribe((pedidoRes) => {
        if (pedidoRes != null) {
          this.cambiarEstado(false);
        }
      });
  }

  onCancelar() {
    this.inicializar();
  }

  cambiarEstado(editar: boolean) {
    if (!editar) {
      this.isEditing = false;
      this.buscarProveedorControl.disable();
      this.buscarVendedorControl.disable();
      this.sucursalEntregaControl.disable();
      this.sucursalInfluenciaControl.disable();
      this.diasCreditoControl.disable();
      this.tipoBoletaControl.disable();
      this.fechaEntregaControl.disable();
      this.monedaControl.disable();
    } else {
      this.isEditing = true;
      this.buscarVendedorControl.enable();
      this.sucursalEntregaControl.enable();
      this.sucursalInfluenciaControl.enable();
      this.diasCreditoControl.enable();
      this.tipoBoletaControl.enable();
      this.fechaEntregaControl.enable();
      this.monedaControl.enable();
      this.buscarProveedorControl.enable();
      setTimeout(() => {
        this.proveedorInput.nativeElement.focus();
      }, 100);
    }
  }

  onEditItem(item: PedidoItem, index: number) {
    this.onClearItem();
    this.selectedPedidoItem = new PedidoItem();
    Object.assign(this.selectedPedidoItem, item);
    this.selectedProducto = item.producto;
    this.codigoControl.setValue(this.selectedProducto.codigoPrincipal);
    this.cantidadPresentacionControl.setValue(item.cantidad);
    this.cantidadUnidadControl.setValue(
      item.cantidad * item.presentacion.cantidad
    );
    this.precioPorPresentacionControl.setValue(
      item.precioUnitario * item.presentacion.cantidad
    );
    this.precioUnitarioControl.setValue(item.precioUnitario);
    this.descuentoPresentacionControl.setValue(
      item.presentacion.cantidad * item.descuentoUnitario
    );
    setTimeout(() => {
      this.presentacionControl.setValue(
        this.selectedProducto?.presentaciones?.find(
          (p) => p.id == item.presentacion.id
        ),
        { emitEvent: false }
      );
      this.codigoInput.nativeElement.select();
      this.valorTotalControl.setValue(
        (item.precioUnitario - item.descuentoUnitario) *
          item.presentacion.cantidad *
          item.cantidad
      );
    }, 100);
  }

  pedidoItensHandlePageEvent($event: PageEvent) {
    throw new Error("Method not implemented.");
  }

  onDeleteItem(pedidoItem: PedidoItem, index: number) {
    this.pedidoService
      .onDeletePedidoItem(pedidoItem.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.pedidoDataSource.data = updateDataSource(
            this.pedidoDataSource.data,
            null,
            index
          );
          this.selectedPedidoItemPage.getContent = this.pedidoDataSource.data;
          this.selectedPedidoItemPage.getTotalElements--;
          this.selectedPedido.descuento =
            this.selectedPedido.descuento -
            pedidoItem?.descuentoUnitario * pedidoItem?.cantidad;
          this.selectedPedido.valorTotal =
            this.selectedPedido.valorTotal -
            pedidoItem?.precioUnitario * pedidoItem?.cantidad;
        }
      });
  }

  inicializar() {
    this.buscarVendedorControl.setValue(null);
    this.selectedVendedor = null;
    this.buscarProveedorControl.setValue(null);
    this.selectedProveedor = null;
    this.sucursalEntregaControl.setValue(null);
    this.sucursalInfluenciaControl.setValue(null);
    this.tipoBoletaControl.setValue(this.tipoBoletaList[0]);
    this.onClearItem();
    this.formaPagoControl.setValue(this.formaPagoList[0]);
    this.monedaControl.setValue(this.monedas[0]);
    this.diasCreditoControl.setValue(null);
    this.fechaEntregaControl.setValue(null);
    this.pedidoDataSource.data = [];
    this.productosProveedorDataSource.data = [];
    this.selectedPedidoItemPage = null;
    this.selectedProductoProveedorPage = null;
    this.selectedPedido = null;
    this.cambiarEstado(true);
  }

  historicoComprasHandlePageEvent($event: PageEvent) {}
  onFinalizar() {
    let aux = new Pedido();
    Object.assign(aux, this.selectedPedido);
    aux.estado = PedidoEstado.ACTIVO;
    this.pedidoService
      .onSave(aux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe((res: Pedido) => {
        if (res != null) {
          this.selectedPedido.estado = aux.estado;
          this.pedidoItemFormGroup.disable();
          this.buscarPedidoItemSobrantes();
        }
      });
  }

  buscarPedidoItemSobrantes() {
    this.pedidoService
      .onGetPedidoItemSobrantes(this.selectedPedido.id, 0, this.size)
      .pipe(untilDestroyed(this))
      .subscribe((res2: PageInfo<PedidoItem>) => {
        this.selectedPedidoItemPage = res2;
        this.pedidoDataSource.data = this.selectedPedidoItemPage.getContent;
      });
  }

  onReabrir() {
    let aux = new Pedido();
    Object.assign(aux, this.selectedPedido);
    aux.estado = PedidoEstado.ABIERTO;
    this.pedidoService
      .onSave(aux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe((res: Pedido) => {
        if (res != null) {
          this.selectedPedido.estado = aux.estado;
          this.pedidoItemFormGroup.enable();
        }
      });
  }

  onAgregarNota() {
    this.dialog
      .open(AdicionarNotaRecepcionDialogComponent, {
        data: {
          pedido: this.selectedPedido,
        },
        height: "60%",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.id != null) {
          this.notaRecepcionDataSource.data = updateDataSource(
            this.notaRecepcionDataSource.data,
            res
          );
        }
      });
  }

  onNotaRecepcionClick(notaRecepcion: NotaRecepcion, index) {
    this.selectedNotaRecepcion = notaRecepcion;
    this.buscarPedidoItensPorNotaRecepcion(notaRecepcion.id);
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.pedidoDataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.pedidoDataSource.data.forEach((row) => this.selection.select(row));
  }

  onEnableAddingItemToNota() {
    this.pedidoDisplayedColumns.unshift("select");
    this.isAddingItensToNota = true;
  }

  onDisableAddItemToNota() {
    let selectedPedidoItemList: PedidoItem[] = this.selection.selected;
    if (selectedPedidoItemList?.length > 0) {
      this.pedidoService
        .onAddPedidoItemListToNotaRecepcion(
          this.selectedNotaRecepcion.id,
          extractIds(selectedPedidoItemList)
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res) {
            this.pedidoDisplayedColumns.shift();
            this.isAddingItensToNota = false;
            this.selection.clear();
            this.buscarPedidoItemSobrantes();
          }
        });
    }
  }

  onAddPedidoItemToNota(pedidoItem: PedidoItem, index) {
    if (this.selectedNotaRecepcion == null) {
      return null;
    }
    let selectedPedidoItemList: PedidoItem[] = [pedidoItem];
    if (selectedPedidoItemList?.length > 0) {
      this.pedidoService
        .onAddPedidoItemListToNotaRecepcion(
          this.selectedNotaRecepcion.id,
          extractIds(selectedPedidoItemList)
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res) {
            let aux = this.pedidoItemNotaRecepcionDataSource.data;
            aux.unshift(pedidoItem);
            this.pedidoItemNotaRecepcionDataSource.data = aux;
            this.pedidoDataSource.data = updateDataSource(
              this.pedidoDataSource.data,
              null,
              index
            );
            this.selectedNotaRecepcion.cantidadItens++;
            this.totalItensAgregados++;
            this.onUpdateChart();
            this.selectedNotaRecepcion.valor =
              this.selectedNotaRecepcion.valor + pedidoItem.valorTotal;
          }
        });
    }
  }

  onDeleteItemFromNota(pedidoItem: PedidoItem, index: number) {
    if (this.selectedNotaRecepcion == null) {
      return null;
    }
    let selectedPedidoItemList: PedidoItem[] = [pedidoItem];
    if (selectedPedidoItemList?.length > 0) {
      this.pedidoService
        .onAddPedidoItemListToNotaRecepcion(
          null,
          extractIds(selectedPedidoItemList)
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res) {
            let aux = this.pedidoDataSource.data;
            aux.unshift(pedidoItem);
            this.pedidoDataSource.data = aux;
            this.pedidoItemNotaRecepcionDataSource.data = updateDataSource(
              this.pedidoItemNotaRecepcionDataSource.data,
              null,
              index
            );
            this.selectedNotaRecepcion.cantidadItens--;
            this.totalItensAgregados--;
            this.onUpdateChart();

            this.selectedNotaRecepcion.valor =
              this.selectedNotaRecepcion.valor - pedidoItem.valorTotal;
          }
        });
    }
  }

  onUpdateChart() {
    this.single = [];
    if (this.totalItensAgregados > 0) {
      this.single.push({
        name: "Agregado",
        value: this.totalItensAgregados,
      });
    }
    this.single.push({
      name: "Falta",
      value: this.selectedPedido?.cantPedidoItem - this.totalItensAgregados,
    });
  }

  onFinalizarRecepcion() {

  }

  onDividirItem(pedidoItem: PedidoItem, index: number){   
    console.log(pedidoItem);
    
    this.dialog.open(DividirItemDialogComponent, {
      width: '70%',
      height: '40%',
      data: {
        pedido: this.selectedPedido,
        pedidoItem: pedidoItem
      }
    })
  }
}

/*
TO DO
1 - Al agregar una nota, cuando se sale del cuadro de dialogo no se carga la nota nueva a la lista de notas
2 - Una vez que se cargue todas los itens en las notas se debe de habilitar un boton que diga Finalizar
3 - 
 */
