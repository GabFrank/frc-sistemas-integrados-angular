import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, Validators } from "@angular/forms";

import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatDatepicker } from "@angular/material/datepicker";
import { MatDialog } from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
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
import { Pedido } from "./pedido.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import { Producto } from "../../../productos/producto/producto.model";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { CurrencyMask } from "../../../../commons/core/utils/numbersUtils";
import { CostoPorProductoService } from "../../costo-por-producto/costo-por-producto.service";
import { PageInfo } from "../../../../app.component";
import { CostoPorProducto } from "../../costo-por-producto/costo-por-producto.model";
import { comparatorLike } from "../../../../commons/core/utils/string-utils";
import { CompraService } from "../../compra/compra.service";
import { CompraItem } from "../../compra/compra-item.model";
import { ProductoProveedorService } from "../../../productos/producto-proveedor/producto-proveedor.service";
import { ProductoProveedor } from "../../../productos/producto-proveedor/producto-proveedor.model";
import { PageEvent } from "@angular/material/paginator";

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
  tipoBoletaList: any[] = ["LEGAL", "COMUN", "EXTRANJERO"];
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
  productoProveedorDisplayedColumns = [
    "codigo",
    "descripcion",
    "stock",
    "sugerido",
    "menu",
  ];

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
  expandedPedido: Pedido;
  pedidoDataSource = new MatTableDataSource<any>([]);
  pedidoDisplayedColumns = [
    "codigo",
    "descripcion",
    "presentacion",
    "cantidad",
    "precioUnitario",
    "precioPresentacion",
    "menu",
    "delete",
  ];

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
    private productoProveedorService: ProductoProveedorService
  ) {}

  ngOnInit(): void {
    this.sucursalService
      .onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.sucursalList = res.filter((s) => s.deposito == true);
      });

    this.monedaService
      .onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.monedas = res;
        this.auxMonedas = res;
      });

    this.formaPagoService
      .onGetAllFormaPago()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.formaPagoList = res;
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
          }
        }
      });

    this.presentacionControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        let aux = this.precioUnitarioControl.value;
        this.precioUnitarioControl.setValue(aux);
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
      this.vendedorInput.nativeElement.focus();

      this.productoProveedorService
        .getByProveedorId(
          proveedor.id,
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
      this.buscarProveedorControl.setValue(null);
      this.vendedorInput.nativeElement.focus();
    }
  }

  onFiltrarProductoProveedor() {
    this.productoProveedorService
      .getByProveedorId(
        this.selectedProveedor.id,
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
      query: this.proveedorService.proveedorSearch,
      tableData: tableData,
      titulo: "Buscar proveedor",
      search: false,
      texto: this.buscarProveedorControl.value,
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

  onSelectVendedor(vendedor: Vendedor) {
    if (vendedor != null) {
      this.selectedVendedor = vendedor;
      this.buscarVendedorControl.setValue(
        this.selectedVendedor.id + " - " + this.selectedVendedor.persona.nombre
      );
      this.sucursalSelect.focus();
    } else {
      this.selectedVendedor = null;
      this.buscarVendedorControl.setValue(null);
      this.vendedorInput.nativeElement.focus();
    }
  }

  onClearVendedor() {
    this.onSelectVendedor(null);
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

  onSaveItem() {}
  onClearItem() {
    this.selectedProducto = null;
    this.codigoControl.setValue(null);
    this.presentacionControl.setValue(null);
    this.cantidadPresentacionControl.setValue(null);
    this.cantidadUnidadControl.setValue(null);
    this.precioPorPresentacionControl.setValue(0);
    this.precioUnitarioControl.setValue(0);
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

  onSelectProducto(producto: Producto) {
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
        this.selectedProducto.presentaciones[0]
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
        this.selectedProducto.presentaciones[0]
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
        this.historicoCompraItemDataSource.data = res;
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
    this.filteredProductosProveedorDataSource.data =
      this.productosProveedorDataSource.data.filter((p) =>
        comparatorLike(
          this.buscarProductoProveedor.value,
          p.producto.descripcion
        )
      );
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
    console.log(e);
  }

  onProductoProveedorItemClick(productoProveedor: ProductoProveedor, i) {
    this.productoService
      .getProducto(productoProveedor.producto.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.onSelectProducto(res);
        }
      });
  }

  productoProveedorHandlePageEvent(e: PageEvent) {
    this.productoProveedorPageIndex = e.pageIndex;
    this.productoProveedorPageSize = e.pageSize;
    this.onFiltrarProductoProveedor();
  }
}
