import {
  animate, state,
  style,
  transition, trigger
} from "@angular/animations";
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from "@angular/core";
import { FormControl, Validators } from "@angular/forms";

import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatDatepicker } from "@angular/material/datepicker";
import { MatDialog } from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { FrcSearchableSelectComponent } from "../../../../shared/components/frc-searchable-select/frc-searchable-select.component";
import { SearchListDialogComponent, SearchListtDialogData, TableData } from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
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
import { PdvSearchProductoData, PdvSearchProductoDialogComponent, PdvSearchProductoResponseData } from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { CurrencyMask } from "../../../../commons/core/utils/numbersUtils";

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
  @ViewChild('proveedorInput', { static: false }) proveedorInput: ElementRef;
  @ViewChild('vendedorInput', { static: false }) vendedorInput: ElementRef;
  @ViewChild('sucursalSelect', { static: false, read: MatSelect }) sucursalSelect: MatSelect;
  @ViewChild('sucursalEntregaSelect', { static: false, read: MatSelect }) sucursalEntregaSelect: MatSelect;
  @ViewChild('presentacionSelect', { static: false, read: MatSelect }) presentacionSelect: MatSelect;
  @ViewChild("autoMonedaInput", { static: false, read: MatAutocompleteTrigger })
  matMonedaTrigger: MatAutocompleteTrigger;
  @ViewChild("autoMonedaInput", { static: false })
  autoMonedaInput: ElementRef;
  @ViewChild('diasCreditoInput', { static: false }) diasCreditoInput: ElementRef;
  @ViewChild('formaPagoSelect', { read: FrcSearchableSelectComponent }) formaPagoSelect: FrcSearchableSelectComponent;
  @ViewChild('monedaSelect', { read: FrcSearchableSelectComponent }) monedaSelect: FrcSearchableSelectComponent;
  @ViewChild('picker') picker: MatDatepicker<Date>;
  @ViewChild('codigoInput', { static: false }) codigoInput: ElementRef;
  @ViewChild('cantidadPresentacionInput', { static: false }) cantidadPresentacionInput: ElementRef;
  @ViewChild('cantidadUnidadInput', { static: false }) cantidadUnidadInput: ElementRef;

  //datos del proveedor
  selectedProveedor: Proveedor;

  //datos del vendedor
  selectedVendedor: Vendedor;
  vendedorList: Vendedor[];

  //Controles del formulario
  buscarProveedorControl = new FormControl(null, Validators.required)
  buscarVendedorControl = new FormControl(null, Validators.required)
  sucursalInfluenciaControl = new FormControl(null)
  sucursalEntregaControl = new FormControl(null)
  tipoBoletaControl = new FormControl('LEGAL')
  diasCreditoControl = new FormControl(null)
  fechaEntregaControl = new FormControl(null)
  fechaEntregaDisplayControl = new FormControl(null)
  codigoControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl(null)
  presentacionControl = new FormControl(null)
  cantidadUnidadControl = new FormControl(null)
  cantidadPresentacionControl = new FormControl(null)
  formaPagoControl = new FormControl(null)
  precioPorPresentacionControl = new FormControl(null)
  precioUnitarioControl = new FormControl(null)
  monedaControl = new FormControl(null)
  selectedMoneda: Moneda;
  selectedFormaPago: FormaPago;

  //Listas
  presentacionList: Presentacion[];
  sucursalList: Sucursal[];
  tipoBoletaList: any[] = [
    'LEGAL',
    'COMUN',
    'EXTRANJERO'
  ]
  formaPagoList: FormaPago[];
  monedas: Moneda[];
  auxMonedas: Moneda[];

  //datos de sucursales
  sucursalInfluenciaSelect: any;


  //datos de tabla Productos del Proveedor
  expandedProductoProveedor: any;
  productosProveedorDataSource = new MatTableDataSource<ProductoDelProveedor>([])
  productoProveedorDisplayedColumns = [
    'codigo',
    'descripcion',
    'stock',
    'sugerido'
  ]

  //datos de tabla de historico de precios
  expandedhistoricoPrecio: any;
  historicoPrecioDataSource = new MatTableDataSource<any>([])
  historicoPrecioDisplayedColumns = [
    'fecha',
    'presentacion',
    'cantidad',
    'precio',
    'menu'
  ]

  //datos de tabla de itens del pedido
  expandedPedido: Pedido;
  pedidoDataSource = new MatTableDataSource<any>([])
  pedidoDisplayedColumns = [
    'codigo',
    'descripcion',
    'presentacion',
    'cantidad',
    'precioUnitario',
    'precioPresentacion',
    'menu',
    'delete'
  ]

  //datos de fecha de entrega
  initialDates: Date[] = [];  // Example initial dates

  //datos del producto
  isPesable = false;
  selectedProducto: Producto;

  //flags de control
  isDialogOpen = false;

  //mascara para formatear los numeros a monedas
  currencyMask = new CurrencyMask();

  constructor(
    private proveedorService: ProveedorService,
    private vendedorService: VendedorService,
    private dialog: MatDialog,
    private cargandoService: CargandoDialogService,
    private sucursalService: SucursalService,
    private monedaService: MonedaService,
    public formaPagoService: FormaPagoService,
    private productoService: ProductoService,
    private matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this)).subscribe(res => {
      this.sucursalList = res.filter(s => s.deposito == true);
    })

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      this.monedas = res;
      this.auxMonedas = res;
    })

    this.formaPagoService.onGetAllFormaPago().pipe(untilDestroyed(this)).subscribe(res => {
      this.formaPagoList = res;
    })

    this.cantidadPresentacionControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      if (!isNaN(+res)) {
        if (this.presentacionControl?.value?.cantidad != null) {
          this.cantidadUnidadControl.setValue(res * this.presentacionControl?.value?.cantidad)
        }
      }
    })

    this.precioPorPresentacionControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      if (!isNaN(+res)) {
        if (this.presentacionControl?.value?.cantidad != null) {
          this.precioUnitarioControl.setValue(res / this.presentacionControl?.value?.cantidad, { emitEvent: false })
        }
      }
    })

    this.precioUnitarioControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      if (!isNaN(+res)) {
        if (this.presentacionControl?.value?.cantidad != null) {
          this.precioPorPresentacionControl.setValue(res * this.presentacionControl?.value?.cantidad, { emitEvent: false })
        }
      }
    })

    this.presentacionControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      let aux = this.precioUnitarioControl.value;
      this.precioUnitarioControl.setValue(aux)
    })

    this.productosProveedorDataSource.data = [
      {
        id: 99,
        proveedor: 'CAMPOS S.A.',
        producto: {
          descripcion: 'BRAHMA CHOPP LATA 269 ML',
          codigo: '570938475934'
        },
        stockTotal: 335,
        stockPorSucursal: [
          {
            sucursal: 'CENTRAL',
            stock: 185
          },
          {
            sucursal: 'ROTONDA',
            stock: 335 - 185
          }
        ],
        sugeridoTotal: 300,
        sugeridoPorSucursal: [
          {
            sucursal: 'CENTRAL',
            stock: 180
          },
          {
            sucursal: 'ROTONDA',
            stock: 120
          }
        ],
      }
    ]

  }

  ngAfterViewInit(): void {
    this.cargandoService.openDialog()
    setTimeout(() => {
      this.proveedorInput.nativeElement.focus()
      this.cargandoService.closeDialog()
    }, 1000);
  }

  /*Esta funcion buscara un proveedor de acuerdo al texto ingresado
  si el texto es vacio, entonces abrira el dialogo de buscar proveedores
  si el texto contiene el codigo (ID) del proveedor, se buscara por ID, 
  si se encuentra 1 proveedor, se cargara automaticamente, si no se encuentra abrira el dialogo de buscar proveedores
  si el texto contiene un string, se abrira el dialogo de buscar proveedor filtrado por ese string
  */
  onBuscarProveedor() {
    if (this.buscarProveedorControl.valid) { //verificar si se ingreso algun texto en el buscador
      let texto: string = this.buscarProveedorControl.value;
      if (!isNaN(+texto)) { //verificar si el texto es un numero (ID)
        this.proveedorService.onGetPorId(+texto).pipe(untilDestroyed(this)).subscribe(res => {
          this.onSelectProveedor(res);
        })
      } else if (this.selectedProveedor != null && texto.includes(this.selectedProveedor.persona.nombre)) {
        this.vendedorInput.nativeElement.focus()
      } else {
        this.onSearchProveedorPorTexto()
      }
    } else {
      this.onSearchProveedorPorTexto()
    }
  }

  onSearchProveedorPorTexto() {
    let tableData: TableData[] = [
      {
        id: 'id',
        nombre: 'Id'
      },
      {
        id: 'nombre',
        nombre: 'Nombre',
        nested: true,
        nestedId: 'persona'
      },
      {
        id: 'documento',
        nombre: 'RUC/CI',
        nested: true,
        nestedId: 'persona'
      }
    ]
    let data: SearchListtDialogData = {
      query: this.proveedorService.proveedorSearch,
      tableData: tableData,
      titulo: 'Buscar proveedor',
      search: true,
      texto: this.buscarProveedorControl.value,
      inicialSearch: this.buscarProveedorControl.valid
    }
    this.dialog.open(SearchListDialogComponent, {
      data: data,
      width: '60%',
      height: '80%'
    }).afterClosed().subscribe((res: Proveedor) => {
      if ((res) != null) {
        this.onSelectProveedor(res)
      }
    })
  }

  /*
  Funcion en donde pasamos el proveedor encontrado
  */
  onSelectProveedor(proveedor: Proveedor) {
    if (proveedor != null) {
      this.vendedorList = proveedor?.vendedores;
      this.selectedProveedor = proveedor;
      this.buscarProveedorControl.setValue(this.selectedProveedor.id + " - " + this.selectedProveedor.persona.nombre)
      this.vendedorInput.nativeElement.focus()
    } else {
      this.vendedorList = null;
      this.selectedProveedor = null;
      this.buscarProveedorControl.setValue(null);
      this.vendedorInput.nativeElement.focus()
    }
  }

  onClearProveedor() {
    this.onSelectProveedor(null);
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
        id: 'id',
        nombre: 'Id'
      },
      {
        id: 'nombre',
        nombre: 'Nombre',
        nested: true,
        nestedId: 'persona'
      },
      {
        id: 'documento',
        nombre: 'RUC/CI',
        nested: true,
        nestedId: 'persona'
      }
    ]
    let data: SearchListtDialogData = {
      query: this.proveedorService.proveedorSearch,
      tableData: tableData,
      titulo: 'Buscar proveedor',
      search: false,
      texto: this.buscarProveedorControl.value,
      inicialSearch: false,
      inicialData: this.vendedorList
    }
    this.dialog.open(SearchListDialogComponent, {
      data: data,
      width: '60%',
      height: '80%'
    }).afterClosed().subscribe((res: Vendedor) => {
      if ((res) != null) {
        this.onSelectVendedor(res)
      }
    })
  }

  onSelectVendedor(vendedor: Vendedor) {
    if (vendedor != null) {
      this.selectedVendedor = vendedor;
      this.buscarVendedorControl.setValue(this.selectedVendedor.id + " - " + this.selectedVendedor.persona.nombre)
      this.sucursalSelect.focus()
    } else {
      this.selectedVendedor = null;
      this.buscarVendedorControl.setValue(null);
      this.vendedorInput.nativeElement.focus()
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
        this.setFocusToValorInput()
        this.matMonedaTrigger.closePanel();
      }, 1000);
    }
  }

  setFocusToValorInput() {

  }

  displayMoneda(value?: number) {
    let res = value ? this.monedas?.find((_) => _.id === value) : undefined;
    this.selectedMoneda = res;
    this.setFocusToValorInput();
    return res ? res.id + " - " + res.denominacion : undefined;
  }

  onFormaPagoEnter() {
    // if()
  }

  onMonedaAutoClosed() {

  }

  onSaveItem() {

  }
  onClearItem() {

  }

  handleFormaPagoSelectionChange(value) {
    this.formaPagoControl.setValue(value);
    this.selectedFormaPago = value;
    if (this.selectedFormaPago.descripcion.includes('TARJETA')) {
      this.monedas = this.auxMonedas.filter(m => m.denominacion.includes('GUARANI'));
    } else if (this.selectedFormaPago.descripcion.includes('PIX')) {
      this.monedas = this.auxMonedas.filter(m => m.denominacion.includes('REAL'));
    } else {
      this.monedas = this.auxMonedas;
    }
  }

  handleMonedaSelectionChange(value: any) {
    this.monedaControl.setValue(value);
    this.selectedMoneda = value;
  }

  handleDatesChanged(dates: Date[]) {
    this.fechaEntregaControl.setValue(dates)
  }

  onMasOpciones() {

  }

  onSearchPorCodigo() {
    if (this.codigoControl.valid) {
      let text = this.codigoControl.value;
      this.isPesable = false;
      let peso;
      let codigo;
      if (text.length == 13 && text.substring(0, 2) == '20') {
        this.isPesable = true;
        codigo = text.substring(2, 7)
        peso = +text.substring(7, 12) / 1000
        text = codigo
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
      this.productoService.onGetProductoPorCodigo(text).subscribe(res => {
        if (res != null) {
          this.selectedProducto = res;
          this.precioUnitarioControl.setValue(this.selectedProducto?.costo?.ultimoPrecioCompra)
          if (this.selectedProducto?.presentaciones?.length == 1) {
            this.presentacionControl.setValue(this.selectedProducto.presentaciones[0])
            if (!this.isPesable) {
              this.cantidadPresentacionControl.setValue(1)
              this.cantidadUnidadControl.setValue(this.presentacionControl.value?.cantidad)
            }
            // if (this.selectedProducto.balanza) {
            //   this.vencimientoInput.nativeElement.select()
            // } else {
            //   this.cantPresentacionInput.nativeElement.select()
            // }
            this.cantidadPresentacionInput.nativeElement.select()
          } else if (this.selectedProducto?.presentaciones?.length > 1) {
            this.presentacionControl.setValue(this.selectedProducto.presentaciones[0])
            this.presentacionSelect.focus()
            this.presentacionSelect.open()
          } else {

          }
        } else {
          this.onAddItem(this.codigoControl.value)
        }
      })
    } else {
      this.onAddItem()
    }
  }

  onCodigoFocus() {
    this.codigoInput.nativeElement.select()
  }

  onAddItem(texto?) {
    this.isDialogOpen = true;
    let data: PdvSearchProductoData = {
      texto: texto,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true
    }
    this.matDialog.open(PdvSearchProductoDialogComponent, {
      data: data,
      height: '80%',
    }).afterClosed().subscribe(res => {
      this.isDialogOpen = false;
      let response: PdvSearchProductoResponseData = res;
      this.selectedProducto = response.producto;
      this.codigoControl.setValue(`${this.selectedProducto?.id} - ${this.selectedProducto?.descripcion}`)
      this.precioUnitarioControl.setValue(this.selectedProducto?.costo?.ultimoPrecioCompra)
      this.presentacionControl.setValue(response.presentacion)
      this.cantidadPresentacionControl.setValue(1)
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
        this.cantidadPresentacionInput.nativeElement.select()
      }, 100);
    })
  }

}
