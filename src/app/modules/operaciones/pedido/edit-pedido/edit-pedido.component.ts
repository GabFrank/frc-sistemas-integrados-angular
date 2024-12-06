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
import { AdicionarProveedorDialogComponent } from "../../../personas/proveedor/adicionar-proveedor-dialog/adicionar-proveedor-dialog.component";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { EditarPedidpItemDialogComponent } from "../editar-pedidp-item-dialog/editar-pedidp-item-dialog.component";
import { NotaRecepcionService } from "../nota-recepcion/nota-recepcion.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";

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
  buscarVendedorControl = new FormControl(null);
  sucursalInfluenciaControl = new FormControl(null);
  sucursalEntregaControl = new FormControl(null);
  tipoBoletaControl = new FormControl("LEGAL");
  diasCreditoControl = new FormControl(null);
  fechaEntregaControl = new FormControl(null);
  fechaEntregaDisplayControl = new FormControl(null);
  productoIdControl = new FormControl(null);
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
    "id",
    "codigo",
    "descripcion",
    "presentacion",
    "cantidad",
    "precioUnitario",
    "precioPresentacion",
    // "descuentoPresentacion",
    "total",
    "menu",
  ];
  pedidoItemNotaRecepcionDisplayedColumns = [
    "id",
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
  selectedPedidoItemSobrante: PedidoItem;
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
    domain: ["#43a047", "#f44336", "#363636"],
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
    private cdr: ChangeDetectorRef,
    private notaRecepcionService: NotaRecepcionService,
    private dialogoService: DialogosService
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
        console.log(monedas[2].cambio);
      },
      error: (error) => {
        // Handle errors
      },
    });

    this.presentacionControl.valueChanges.subscribe((data) => {
      this.calcularTotal();
    });

    this.cantidadPresentacionControl.valueChanges.subscribe((data) => {
      this.calcularTotal();
    });

    this.precioPorPresentacionControl.valueChanges.subscribe((data) => {
      this.calcularTotal();
    });

    this.descuentoPresentacionControl.valueChanges.subscribe((data) => {
      this.calcularTotal();
    });
  }

  calcularTotal() {
    if (this.selectedProducto != null) {
      this.cantidadUnidadControl.setValue(
        this.presentacionControl?.value?.cantidad *
          this.cantidadPresentacionControl?.value,
        { emitEvent: false }
      );
      this.precioPorPresentacionControl.setValue(
        (this.precioUnitarioControl.value || 0) *
          this.presentacionControl.value?.cantidad,
        { emitEvent: false }
      );
      this.valorTotalControl.setValue(
        (this.precioPorPresentacionControl.value -
          this.descuentoPresentacionControl.value) *
          this.cantidadPresentacionControl.value,
        { emitEvent: false }
      );
    }
  }

  onCargarDatos(pedido: Pedido) {
    console.log(pedido);

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

    this.onUpdateChart();

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
    } else if (this.selectedPedido.estado == PedidoEstado.EN_RECEPCION_NOTA) {
      this.pedidoDisplayedColumns.push("check");
      this.pedidoItemFormGroup.disable();
    }

    this.onBuscarItens(pedido);

    setTimeout(() => {
      this.codigoInput.nativeElement.focus();
    }, 500);
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
        console.log(res.getContent);

        this.selectedNotaRecepcion.pedidoItemList = res.getContent;
        this.notaRecepcionDataSource.data = updateDataSourceWithId(
          this.notaRecepcionDataSource.data,
          this.selectedNotaRecepcion,
          this.selectedNotaRecepcion.id
        );
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
      isAdicionar: true,
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
          if (res["adicionar"] == true) {
            console.log(res);

            this.matDialog
              .open(AdicionarProveedorDialogComponent, {
                width: "600px",
              })
              .afterClosed()
              .subscribe((proveedorRes) => {
                if (proveedorRes?.id != null) {
                  this.onSelectProveedor(proveedorRes);
                }
              });
          } else if (res?.id != null) {
            this.onSelectProveedor(res);
          }
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
      isAdicionar: true,
    };
    this.dialog
      .open(SearchListDialogComponent, {
        data: data,
        width: "60%",
        height: "80%",
      })
      .afterClosed()
      .subscribe((res: Vendedor) => {
        // if (res != null) {
        //   if(res['adicionar']==true){
        //     console.log(res);
        //     this.matDialog.open(Addven, {
        //       width: '600px'
        //     }).afterClosed().subscribe(proveedorRes => {
        //       if(proveedorRes?.id != null){
        //         this.onSelectProveedor(proveedorRes);
        //       }
        //     })
        //   } else if(res?.id != null) {
        //     this.onSelectProveedor(res);
        //   }
        // }
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

  async onSaveItem() {
    if (this.selectedPedido?.id == null) {
      await this.onGuardar();
      await this.savePedidoItem();
    } else {
      this.savePedidoItem();
    }
  }

  savePedidoItem() {
    let newData = true;
    if (this.selectedPedidoItem == null) {
      this.selectedPedidoItem = new PedidoItem();
      this.selectedPedidoItem.usuarioCreacion = this.selectedPedido?.usuario;
    } else {
      newData = false;
    }
    this.selectedPedidoItem.pedido = this.selectedPedido;
    this.selectedPedidoItem.producto = this.selectedProducto;
    this.selectedPedidoItem.presentacionCreacion =
      this.presentacionControl.value;
    this.selectedPedidoItem.cantidadCreacion =
      this.cantidadPresentacionControl.value;
    this.selectedPedidoItem.precioUnitarioCreacion =
      this.precioUnitarioControl.value;
    this.selectedPedidoItem.descuentoUnitarioCreacion =
      this.descuentoPresentacionControl.value /
      this.selectedPedidoItem.presentacionCreacion.cantidad;
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
            if (this.selectedPedidoItemPage == null)
              this.selectedPedidoItemPage = new PageInfo<PedidoItem>();
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
    this.selectedPedidoItem = null;
    this.selectedProducto = null;
    this.codigoControl.setValue(null);
    this.presentacionControl.setValue(null);
    this.cantidadPresentacionControl.setValue(null);
    this.cantidadUnidadControl.setValue(null);
    this.precioPorPresentacionControl.setValue(0);
    this.precioUnitarioControl.setValue(0);
    this.valorTotalControl.setValue(0);
    this.descuentoPresentacionControl.setValue(0);
    this.codigoInput.nativeElement.focus();
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
    setTimeout(() => {
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
    }, 100);
  }

  onSelectProducto(producto: Producto, openPresentacion = true) {
    this.selectedProducto = producto;
    this.productoIdControl.setValue(this.selectedProducto.id);
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
        this.codigoControl.setValue(this.selectedProducto?.descripcion);
        this.precioUnitarioControl.setValue(
          this.selectedProducto?.costo?.ultimoPrecioCompra
        );
        this.presentacionControl.setValue(response.presentacion);
        this.cantidadPresentacionControl.setValue(1);
        this.productoIdControl.setValue(this.selectedProducto.id);
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
  async onGuardar() {
    return new Promise((resolve, reject) => {
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
          this.sucursalEntregaControl.value?.map(
            (entity: Sucursal) => entity.id
          ),
          this.sucursalInfluenciaControl.value?.map(
            (entity: Sucursal) => entity.id
          ),
          this.mainService.usuarioActual.id
        )
        .pipe(untilDestroyed(this))
        .subscribe((pedidoRes) => {
          if (pedidoRes != null) {
            this.selectedPedido.id = pedidoRes.id;
            this.idControl.setValue(this.selectedPedido.id);
            this.cambiarEstado(false);
            resolve(pedidoRes);
          } else {
            reject(null);
          }
        });
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
    this.cantidadPresentacionControl.setValue(item.cantidadCreacion);
    this.cantidadUnidadControl.setValue(
      item.cantidadCreacion * item.presentacionCreacion.cantidad
    );
    this.precioPorPresentacionControl.setValue(
      item.precioUnitarioCreacion * item.presentacionCreacion.cantidad
    );
    this.precioUnitarioControl.setValue(item.precioUnitarioCreacion);
    this.descuentoPresentacionControl.setValue(
      item.presentacionCreacion.cantidad * item.descuentoUnitarioCreacion
    );
    setTimeout(() => {
      this.presentacionControl.setValue(
        this.selectedProducto?.presentaciones?.find(
          (p) => p.id == item.presentacionCreacion.id
        ),
        { emitEvent: false }
      );
      this.codigoInput.nativeElement.select();
      this.valorTotalControl.setValue(
        (item.precioUnitarioCreacion - item.descuentoUnitarioCreacion) *
          item.presentacionCreacion.cantidad *
          item.cantidadCreacion
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
            pedidoItem?.descuentoUnitarioCreacion *
              pedidoItem?.cantidadCreacion;
          this.selectedPedido.valorTotal =
            this.selectedPedido.valorTotal -
            pedidoItem?.precioUnitarioCreacion * pedidoItem?.cantidadCreacion;
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
    switch (this.selectedPedido?.estado) {
      case PedidoEstado.ABIERTO:
        let aux = new Pedido();
        Object.assign(aux, this.selectedPedido);
        aux.estado = PedidoEstado.ACTIVO;
        this.pedidoService
          .onSave(aux.toInput())
          .pipe(untilDestroyed(this))
          .subscribe((res: Pedido) => {
            if (res != null) {
              this.selectedPedido = res;
              this.totalItensAgregados = 0;
              this.pedidoItemFormGroup.disable();
              this.buscarPedidoItemSobrantes();
              this.pedidoDisplayedColumns.push("check");
            }
          });
        break;
      case PedidoEstado.ACTIVO:
        this.onCambiarEstado(PedidoEstado.EN_RECEPCION_NOTA);
        break;
      case PedidoEstado.EN_RECEPCION_NOTA:
        this.dialogoService
          .confirm(
            "Atención!!",
            "Deseas finalizar esta etapa?",
            "Esta acción se puede deshacer"
          )
          .subscribe((dialogRes) => {
            if (dialogRes) {
              this.onCambiarEstado(PedidoEstado.EN_RECEPCION_MERCADERIA);
            }
          });
        break;
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
        this.dialogoService
          .confirm(
            "Atención!!",
            "Deseas finalizar esta etapa?",
            "Esta acción se puede deshacer"
          )
          .subscribe((dialogRes) => {
            if (dialogRes) {
              this.onCambiarEstado(PedidoEstado.CONCLUIDO);
            }
          });
        break;
      case PedidoEstado.CONCLUIDO:
        break;
      case PedidoEstado.CANCELADO:
        break;
      default:
        break;
    }
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
    this.pedidoDisplayedColumns.pop();
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

  onAgregarNota(nuevo?) {
    this.dialog
      .open(AdicionarNotaRecepcionDialogComponent, {
        data: {
          pedido: this.selectedPedido,
          notaRecepcion: !nuevo ? this.selectedNotaRecepcion : null,
          notaRecepcionList: this.notaRecepcionDataSource.data,
        },
        height: "60%",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.id != null) {
          this.selectedNotaRecepcion = res;
          this.notaRecepcionDataSource.data = updateDataSourceWithId(
            this.notaRecepcionDataSource.data,
            res,
            this.selectedNotaRecepcion?.id
          );
          if (this.selectedPedido.estado == PedidoEstado.ACTIVO) {
            this.onCambiarEstado(PedidoEstado.EN_RECEPCION_NOTA);
          }
        } else if (res?.nuevo) {
          this.selectedNotaRecepcion = null;
          this.onAgregarNota();
        }
      });
  }

  onNotaRecepcionClick(notaRecepcion: NotaRecepcion, index) {
    this.selectedNotaRecepcion = notaRecepcion;
    if (this.selectedNotaRecepcion.pedidoItemList == null) {
      this.buscarPedidoItensPorNotaRecepcion(notaRecepcion.id);
    } else {
      this.pedidoItemNotaRecepcionDataSource.data =
        this.selectedNotaRecepcion.pedidoItemList;
    }
  }

  onRefreshNotaRecepcion(notaRecepcion: NotaRecepcion) {
    if (notaRecepcion != null) {
      this.notaRecepcionService
        .onGetNotaRecepcion(notaRecepcion.id)
        .subscribe((res) => {
          if (res != null) {
            this.selectedNotaRecepcion.valor = res.valor;
            this.notaRecepcionDataSource.data = updateDataSourceWithId(
              this.notaRecepcionDataSource.data,
              this.selectedNotaRecepcion,
              this.selectedNotaRecepcion.id
            );
            this.onUpdateChart();
          }
        });
    }
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

  onChangePedidoItemSelection(
    pedidoItem: PedidoItem,
    e: MatCheckboxChange,
    index
  ) {
    if (e.checked) {
      this.onAddPedidoItemToNota(pedidoItem, index);
    } else {
      this.onDeleteItemFromNota(pedidoItem, index);
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
            this.pedidoDataSource.data = updateDataSourceWithId(
              this.pedidoDataSource.data,
              null,
              pedidoItem.id
            );
            this.selectedNotaRecepcion.cantidadItens++;
            this.totalItensAgregados++;
            this.onUpdateChart();
            this.selectedNotaRecepcion.valor =
              this.selectedNotaRecepcion.valor + pedidoItem.valorTotal;
            if (this.pedidoDataSource.data.length == 0) {
              this.pedidoDisplayedColumns.shift();
              this.isAddingItensToNota = false;
            }
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
            pedidoItem.notaRecepcion = null;
            aux.unshift(pedidoItem);
            this.pedidoDataSource.data = aux;
            this.pedidoItemNotaRecepcionDataSource.data =
              updateDataSourceWithId(
                this.pedidoItemNotaRecepcionDataSource.data,
                null,
                pedidoItem.id
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
    console.log("Agregado", this.totalItensAgregados || 0);
    console.log(
      "Cancelado",
      this.selectedPedido?.cantPedidoItemCancelados || 0
    );
    console.log(
      "Falta",
      this.selectedPedido?.cantPedidoItem -
        this.totalItensAgregados -
        this.selectedPedido?.cantPedidoItemCancelados || 0
    );

    this.single = [];
    this.single.push({
      name: "Agregado",
      value: this.totalItensAgregados || 0,
    });

    this.single.push({
      name: "Cancelado",
      value: this.selectedPedido?.cantPedidoItemCancelados || 0,
    });

    this.single.push({
      name: "Falta",
      value:
        this.selectedPedido?.cantPedidoItem -
          this.totalItensAgregados -
          this.selectedPedido?.cantPedidoItemCancelados || 0,
    });
  }

  onCambiarEstado(estado: PedidoEstado) {
    this.pedidoService
      .onFinalizarPedido(this.selectedPedido.id, estado)
      .subscribe((res) => {
        if (res?.id != null) {
          console.log(res);
          this.selectedPedido.estado = res.estado;
        }
      });
  }

  onDividirItem(pedidoItem: PedidoItem, index: number) {
    console.log(pedidoItem);

    this.dialog
      .open(DividirItemDialogComponent, {
        width: "70%",
        height: "50%",
        data: {
          pedido: this.selectedPedido,
          pedidoItem: pedidoItem,
        },
      })
      .afterClosed()
      .subscribe((dividirRes: PedidoItem[]) => {
        if (dividirRes != null && dividirRes.length > 0) {
          dividirRes.forEach((p) => {
            if (p?.notaRecepcion?.id != null) {
              this.selectedNotaRecepcion.pedidoItemList =
                updateDataSourceWithId(
                  this.selectedNotaRecepcion.pedidoItemList,
                  p,
                  p.id
                );
              this.pedidoItemNotaRecepcionDataSource.data =
                this.selectedNotaRecepcion.pedidoItemList;
            } else {
              this.pedidoDataSource.data = updateDataSourceWithId(
                this.pedidoDataSource.data,
                p,
                p.id
              );
            }
          });
          this.actualizarDetalle();
        }
      });
  }

  onSetSucEntrega() {
    if (this.sucursalInfluenciaControl.value != null) {
      let sucInfluenciaList: Sucursal[] = this.sucursalInfluenciaControl.value;
      if (sucInfluenciaList.length == 1) {
        this.sucursalEntregaControl.setValue(
          this.sucursalInfluenciaControl.value
        );
      }
    }
  }

  onCheckPedidoNotaRecepcion(pedido, i) {
    this.onAddPedidoItemToNota(pedido, i);
  }

  /*
  Esta funcion sirve para modificar un item en la etapa de recepcion de nota
  Abrira un cuadro de dialogo en donde mostrara las opciones de modificacion
  */
  onModificarItem(p, cancelar?, reabrir?, width = "60%") {
    this.matDialog
      .open(EditarPedidpItemDialogComponent, {
        width: width,
        data: {
          pedido: this.selectedPedido,
          pedidoItem: p,
          rechazar: cancelar,
          reabrir: reabrir,
        },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.id != null) {
          if (res?.notaRecepcion != null) {
            console.log(this.selectedNotaRecepcion.pedidoItemList);
            this.selectedNotaRecepcion.pedidoItemList = updateDataSourceWithId(
              this.selectedNotaRecepcion.pedidoItemList,
              res,
              res.id
            );
            console.log(this.selectedNotaRecepcion.pedidoItemList);
            this.pedidoItemNotaRecepcionDataSource.data =
              this.selectedNotaRecepcion.pedidoItemList;
          } else {
            this.pedidoDataSource.data = updateDataSourceWithId(
              this.pedidoDataSource.data,
              res,
              res.id
            );
          }
          this.actualizarDetalle();
        }
      });
  }

  onRechazarItem(p) {
    this.onModificarItem(p, true, false, "50%");
  }

  onReabrirItem(p) {
    this.onModificarItem(p, false, true, "50%");
  }

  actualizarDetalle() {
    this.pedidoService
      .onGetPedidoInfoDetalle(this.selectedPedido.id)
      .subscribe((res) => {
        console.log(res);

        this.selectedPedido.valorTotal = res.valorTotal;
        this.selectedPedido.cantPedidoItem = res.cantPedidoItem;
        this.selectedPedido.cantPedidoItemSinNota = res.cantPedidoItemSinNota;
        this.selectedPedido.cantPedidoItemCancelados =
          res.cantPedidoItemCancelados;
        this.totalItensAgregados =
          this.selectedPedido.cantPedidoItem -
          this.selectedPedido.cantPedidoItemSinNota;
        this.onUpdateChart();
      });
    if (this.selectedNotaRecepcion != null)
      this.onRefreshNotaRecepcion(this.selectedNotaRecepcion);
  }

  onVolverEtapa() {
    switch (this.selectedPedido.estado) {
      case PedidoEstado.EN_RECEPCION_NOTA:
        this.dialogoService
          .confirm("Atención!!", "Deseas retroceder esta etapa?")
          .subscribe((dialogRes) => {
            if (dialogRes) {
              this.onCambiarEstado(PedidoEstado.ACTIVO);
            }
          });
        break;
      case PedidoEstado.EN_RECEPCION_MERCADERIA:
        this.dialogoService
          .confirm("Atención!!", "Deseas retroceder esta etapa?")
          .subscribe((dialogRes) => {
            if (dialogRes) {
              this.onCambiarEstado(PedidoEstado.EN_RECEPCION_NOTA);
            }
          });
        break;
      default:
        break;
    }
  }
}

/*
TO DO
1 - Al agregar una nota, cuando se sale del cuadro de dialogo no se carga la nota nueva a la lista de notas
2 - Una vez que se cargue todas los itens en las notas se debe de habilitar un boton que diga Finalizar
3 - 
 */
