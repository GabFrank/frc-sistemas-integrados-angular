import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { UsuarioSearchGQL } from "../../../personas/usuarios/graphql/usuarioSearch";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import {
  InventarioProductoEstado,
  InventarioProductoItem,
} from "../inventario.model";
import {
  InventarioService,
  VencimientoFiltroParams,
} from "../inventario.service";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { PageInfo } from "../../../../app.component";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { ProductoComponent } from "../../../productos/producto/edit-producto/producto.component";
import { PageEvent, MatPaginator } from "@angular/material/paginator";
import { stringToTime } from "../../../../commons/core/utils/string-utils";

export interface OrderList {
  nombre: string;
  value: string;
  tipo: TipoOrder[];
}

export interface TipoOrder {
  nombre: string;
  value: string;
}

/**
 * Item con la clase de color del vencimiento ya resuelta. Se calcula al recibir
 * la respuesta y no en el template, que no debe llamar funciones.
 */
export type InventarioProductoItemFila = InventarioProductoItem & {
  vencimientoClase: string;
};

export interface VencimientoOpcion {
  nombre: string;
  value: string;
}

export const VENCIMIENTO_FILTRO = {
  VENCIDOS: "VENCIDOS",
  POR_VENCER: "POR_VENCER",
  VIGENTES: "VIGENTES",
  SIN_VENCIMIENTO: "SIN_VENCIMIENTO",
};

const DIAS_POR_VENCER_DEFAULT = 30;
const MS_POR_DIA = 1000 * 60 * 60 * 24;

@UntilDestroy()
@Component({
  selector: "app-list-inventario",
  templateUrl: "./list-inventario.component.html",
  styleUrls: ["./list-inventario.component.scss"],
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
export class ListInventarioComponent implements OnInit {
  @Input() data: Tab;
  
  @ViewChild("buscarUsuarioInput", { static: true })
  buscadorUsuarioInput: ElementRef;
  @ViewChild("buscadorInput", { static: true }) buscadorInput: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<InventarioProductoItemFila>([]);
  expandedInventarioProductoItem: InventarioProductoItem;
  isDialogOpen = false;
  ordenarPorControl = new FormControl();
  tipoOrdenControl = new FormControl();
  selectedPageInfo: PageInfo<InventarioProductoItem>;
  length = 15;
  pageSize = 15;
  pageIndex = 0;

  fechaFormGroup: FormGroup;
  today = new Date();
  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  horaInicioControl = new FormControl("00:00");
  horaFinalControl = new FormControl("23:59");

  sucursalControl = new FormControl();
  sucursalList: Sucursal[];
  sucursalIdList: number[];

  selectedUsuario: Usuario;
  buscarUsuarioControl = new FormControl();

  productoList: Producto[] = [];
  buscarProductoControl = new FormControl();
  isPesable = false;
  selectedProducto: Producto;
  estadoControl = new FormControl();

  vencimientoFiltroControl = new FormControl();
  diasPorVencerControl = new FormControl(DIAS_POR_VENCER_DEFAULT);
  vencimientoDesdeControl = new FormControl();
  vencimientoHastaControl = new FormControl();

  vencimientoOpciones: VencimientoOpcion[] = [
    { nombre: "Vencidos", value: VENCIMIENTO_FILTRO.VENCIDOS },
    { nombre: "Por vencer", value: VENCIMIENTO_FILTRO.POR_VENCER },
    { nombre: "Vigentes", value: VENCIMIENTO_FILTRO.VIGENTES },
    { nombre: "Sin vencimiento", value: VENCIMIENTO_FILTRO.SIN_VENCIMIENTO },
  ];

  /** Controla el campo de dias sin evaluar funciones desde el HTML. */
  mostrarDiasPorVencer = false;

  displayedColumns = [
    "descripcion", //producto
    "codigo", //producto
    "cantidadSistema", //que deberia haber en stock - No esta guardando
    "cantidadFisica", //encontrada en stock
    "saldo", //diferencia inventario
    "texto", //explicito diciendo (falta, sobra)
    "vencimiento",
    "usuario",
    "creadoEn",
    "sucursal"
  ];

  orderList: OrderList[] = [
    {
      nombre: "Descripción",
      value: "presentacion.producto.descripcion",
      tipo: [
        {
          nombre: "A-Z",
          value: "ASC",
        },
        {
          nombre: "Z-A",
          value: "DESC",
        },
      ],
    },
    {
      nombre: "Fecha",
      value: "creadoEn",
      tipo: [
        {
          nombre: "Menor a mayor",
          value: "ASC",
        },
        {
          nombre: "Mayor a menor",
          value: "DESC",
        },
      ],
    },
    {
      nombre: "Vencimiento",
      value: "vencimiento",
      tipo: [
        {
          nombre: "Menor a mayor",
          value: "ASC",
        },
        {
          nombre: "Mayor a menor",
          value: "DESC",
        },
      ],
    }

  ];

  constructor(
    private sucursalService: SucursalService,
    private usuarioSearch: UsuarioSearchGQL,
    private dialog: MatDialog,
    private productoService: ProductoService,
    private inventarioService: InventarioService,
    private tabService: TabService
  ) {}

  ngOnInit(): void {
    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 2);

    this.fechaInicioControl.setValue(aux);
    this.fechaFinalControl.setValue(hoy);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinalControl,
      inicioHora: this.horaInicioControl,
      finHora: this.horaFinalControl,
    });

    this.sucursalList = [];
    this.sucursalIdList = [];

    setTimeout(() => {
      this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
        this.sucursalList = res.filter((s) => {
          if (s.id != 0) {
            this.sucursalIdList.push(s.id);
            return s;
          }
        });
        
        // Procesar datos del TabData para autocompletar filtros si vienen desde movimiento de stock
        this.procesarDatosTabData();
      });
    });
  }

  onFiltrar(resetPage: boolean = false) {
    if (resetPage) {
      this.pageIndex = 0;
      if (this.paginator) this.paginator.firstPage();
    }
    let productoIdList: number[];
    this.productoList.forEach((p) => {
      if (productoIdList == null) productoIdList = [];
      productoIdList.push(p.id);
    });

    let fechaInicial: Date = this.fechaInicioControl.value;
    let fechaFin: Date = this.fechaFinalControl.value;
    let horaInicial: Date = stringToTime(this.horaInicioControl.value);
    let horaFinal: Date = stringToTime(this.horaFinalControl.value);
    fechaInicial.setHours(horaInicial.getHours());
    fechaInicial.setMinutes(horaInicial.getMinutes());
    fechaInicial.setSeconds(horaInicial.getSeconds());
    fechaFin.setHours(horaFinal.getHours());
    fechaFin.setMinutes(horaFinal.getMinutes());
    fechaFin.setSeconds(horaFinal.getSeconds());
    
    const sucursalIds = this.toSucursalesId(this.sucursalControl.value);
    const usuarioIds = this.selectedUsuario != null ? [this.selectedUsuario.id] : null;
    const estado = this.estadoControl.value;
    
    this.inventarioService
      .onGetInventarioProductoItemWithFilters(
        dateToString(fechaInicial),
        dateToString(fechaFin),
        this.pageIndex,
        this.pageSize,
        this.ordenarPorControl.value?.value,
        this.tipoOrdenControl.value?.value,
        sucursalIds,
        usuarioIds,
        productoIdList,
        estado,
        this.construirFiltroVencimiento()
      )
      .pipe(untilDestroyed(this))
      .subscribe((res: PageInfo<InventarioProductoItem>) => {
        this.selectedPageInfo = res;
        this.dataSource.data = this.aFilas(res.getContent);
      });
  }

  /**
   * Arma los parametros de vencimiento que entienden la lista y el reporte.
   * Los dias solo viajan cuando el filtro es POR_VENCER.
   */
  construirFiltroVencimiento(): VencimientoFiltroParams {
    const filtro = this.vencimientoFiltroControl.value;
    const esSinVencimiento = filtro === VENCIMIENTO_FILTRO.SIN_VENCIMIENTO;
    return {
      vencimientoFiltro: filtro,
      diasPorVencer:
        filtro === VENCIMIENTO_FILTRO.POR_VENCER
          ? this.diasPorVencerControl.value || DIAS_POR_VENCER_DEFAULT
          : null,
      vencimientoDesde: esSinVencimiento
        ? null
        : dateToString(this.vencimientoDesdeControl.value),
      vencimientoHasta: esSinVencimiento
        ? null
        : dateToString(this.vencimientoHastaControl.value),
    };
  }

  onVencimientoFiltroSelect() {
    const filtro = this.vencimientoFiltroControl.value;
    this.mostrarDiasPorVencer = filtro === VENCIMIENTO_FILTRO.POR_VENCER;

    // "Sin vencimiento" y un rango de fechas nunca pueden dar resultado juntos.
    if (filtro === VENCIMIENTO_FILTRO.SIN_VENCIMIENTO) {
      this.vencimientoDesdeControl.setValue(null);
      this.vencimientoHastaControl.setValue(null);
      this.vencimientoDesdeControl.disable();
      this.vencimientoHastaControl.disable();
    } else {
      this.vencimientoDesdeControl.enable();
      this.vencimientoHastaControl.enable();
    }
  }

  /**
   * Resuelve el color del vencimiento una sola vez por respuesta: vencido contra
   * hoy (o marcado VENCIDO al contarlo) y proximo dentro de la ventana de dias.
   */
  private aFilas(items: InventarioProductoItem[]): InventarioProductoItemFila[] {
    if (items == null) return [];
    const ahora = new Date().getTime();
    const dias =
      this.diasPorVencerControl.value > 0
        ? this.diasPorVencerControl.value
        : DIAS_POR_VENCER_DEFAULT;
    const limiteProximo = ahora + dias * MS_POR_DIA;

    return items.map((item) => {
      const vencimiento =
        item?.vencimiento != null ? new Date(item.vencimiento).getTime() : null;
      let vencimientoClase = "";
      if (
        item?.estado === InventarioProductoEstado.VENCIDO ||
        (vencimiento != null && vencimiento < ahora)
      ) {
        vencimientoClase = "venc-vencido";
      } else if (vencimiento != null && vencimiento <= limiteProximo) {
        vencimientoClase = "venc-proximo";
      }
      // Object.assign y no spread: la respuesta de Apollo viene congelada y el
      // spread perderia el tipado de InventarioProductoItem.
      return Object.assign({}, item, { vencimientoClase });
    });
  }

  onVer(inventarioProductoItem: InventarioProductoItem) {}

  onRowClick(row, i) {}

  onBuscarUsuario() {
    let data: SearchListtDialogData = {
      titulo: "Buscar Persona",
      query: this.usuarioSearch,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "nickname", nombre: "Nombre", width: "70%" },
      ],
      texto: this.buscarUsuarioControl.value,
      search: true,
      inicialSearch: true,
    };
    // data.
    this.dialog
      .open(SearchListDialogComponent, {
        data,
        height: "80%",
        width: "80%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Usuario) => {
        if (res != null) {
          this.selectedUsuario = res;
          this.buscarUsuarioControl.setValue(`${res.id} - ${res.nickname}`);
        }
      });
  }

  onClearUsuario() {
    this.selectedUsuario = null;
    this.buscarUsuarioControl.setValue(null);
    this.buscadorUsuarioInput.nativeElement.focus();
  }

  onBuscarProducto() {
    let text: string = this.buscarProductoControl.value;
    if (
      this.selectedProducto != null &&
      text.includes(this.selectedProducto.descripcion)
    ) {
      this.onAddProducto();
    } else {
      this.onSearchPorCodigo();
    }
  }

  onSearchPorCodigo() {
    let text = this.buscarProductoControl.value;
    this.isPesable = false;
    let peso;
    let codigo;
    if (text?.length == 13 && text.substring(0, 2) == "20") {
      this.isPesable = true;
      codigo = text.substring(2, 7);
      peso = +text.substring(7, 12) / 1000;
      text = codigo;
    }
    if (text != null) {
      this.productoService.onGetProductoPorCodigo(text).subscribe((res) => {
        if (res != null) {
          this.selectedProducto = res;
          this.onAddProducto();
        } else {
          this.openSearchProducto(text);
        }
      });
    } else {
      this.openSearchProducto(text);
    }
  }

  openSearchProducto(texto?) {
    this.isDialogOpen = true;
    let data: PdvSearchProductoData = {
      texto: texto,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
    };
    this.dialog
      .open(PdvSearchProductoDialogComponent, {
        data: data,
        height: "80%",
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        let response: PdvSearchProductoResponseData = res;
        this.selectedProducto = response.producto;
        this.onAddProducto();
      });
  }

  onAddProducto() {
    this.productoList.push(this.selectedProducto);
    this.buscarProductoControl.setValue(null);
    this.selectedProducto = null;
    this.buscadorInput.nativeElement.focus();
  }

  onClearProducto(producto: Producto, index) {
    this.productoList.splice(index, 1);
  }

  onOrderSelect() {
    if (this.ordenarPorControl.value != null) {
      this.tipoOrdenControl.setValue(this.ordenarPorControl.value.tipo[0]);
    }
  }

  toSucursalesId(sucursales: any[]): number[] {
    let idList: number[] = [];
    if (sucursales == null) return null;
    sucursales?.forEach((sucursal) => {
      if (sucursal?.id != null) {
        idList.push(sucursal.id);
      }
    });
    return idList.length > 0 ? idList : null;
  }

  irAProducto(producto) {
    this.tabService.addTab(
      new Tab(
        ProductoComponent,
        producto.descripcion.toUpperCase(),
        new TabData(null, producto)
      )
    );
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onGenerarPdf(){
    let productoIdList: number[];
    this.productoList.forEach((p) => {
      if (productoIdList == null) productoIdList = [];
      productoIdList.push(p.id);
    });
    if(this.fechaFinalControl.value != null && this.fechaFinalControl.value != null){
      this.inventarioService.onGetReporteInventario(
        dateToString(this.fechaInicioControl.value),
        dateToString(this.fechaFinalControl.value),
        this.pageIndex,
        this.pageSize,
        this.ordenarPorControl.value?.value,
        this.tipoOrdenControl.value?.value,
        null,
        this.toSucursalesId(this.sucursalControl.value),
        this.selectedUsuario != null ? [this.selectedUsuario.id] : null,
        productoIdList,
        this.estadoControl.value,
        this.construirFiltroVencimiento()
      )
    }
  }

  onResetFiltro(){
    // set fecha inicio a 2 dias atras
    let aux = new Date();
    aux.setDate(aux.getDate() - 2);
    this.fechaInicioControl.setValue(aux);
    this.fechaFinalControl.setValue(new Date());
    // set hora inicio a 00:00 and fin to 23:59
    this.horaInicioControl.setValue("00:00");
    this.horaFinalControl.setValue("23:59");
    this.sucursalControl.setValue(null);
    this.selectedUsuario = null;
    this.buscarProductoControl.setValue(null);
    this.buscarUsuarioControl.setValue(null);
    this.ordenarPorControl.setValue(null);
    this.tipoOrdenControl.setValue(null);
    this.estadoControl.setValue(null);
    this.vencimientoFiltroControl.setValue(null);
    this.diasPorVencerControl.setValue(DIAS_POR_VENCER_DEFAULT);
    this.vencimientoDesdeControl.setValue(null);
    this.vencimientoHastaControl.setValue(null);
    this.onVencimientoFiltroSelect();
    }

  procesarDatosTabData() {
    if (this.data?.tabData?.data) {
      const datosMovimiento = this.data.tabData.data;

      if (datosMovimiento.producto) {
        this.selectedProducto = datosMovimiento.producto;
        this.productoList = [datosMovimiento.producto];
        this.buscarProductoControl.setValue(
          `${datosMovimiento.producto.id} - ${datosMovimiento.producto.descripcion}`
        );
      }

      if (datosMovimiento.usuario) {
        this.selectedUsuario = datosMovimiento.usuario;
        this.buscarUsuarioControl.setValue(
          `${datosMovimiento.usuario.id} - ${datosMovimiento.usuario.nickname}`
        );
      }

      if (datosMovimiento.sucursalId) {
        const sucursal = this.sucursalList.find(s => Number(s.id) === Number(datosMovimiento.sucursalId));
        
        if (sucursal) {
          this.sucursalControl.setValue([sucursal]);
        } else {
          console.warn('No se encontró la sucursal con ID:', datosMovimiento.sucursalId);
        }
      }

      if (datosMovimiento.fecha) {
        let fechaMovimiento: Date;
        if (typeof datosMovimiento.fecha === 'string') {
          fechaMovimiento = new Date(datosMovimiento.fecha);
        } else {
          fechaMovimiento = datosMovimiento.fecha;
        }
        
        const fechaInicio = new Date(fechaMovimiento);
        fechaInicio.setHours(0, 0, 0, 0);
        
        const fechaFin = new Date(fechaMovimiento);
        fechaFin.setHours(23, 59, 59, 999);
        
        this.fechaInicioControl.setValue(fechaInicio);
        this.fechaFinalControl.setValue(fechaFin);
      }

      setTimeout(() => {
        this.onFiltrar();
      }, 700);
    }
  }
}
