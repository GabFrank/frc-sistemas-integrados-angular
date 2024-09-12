import { ProductoForPdvGQL } from "../graphql/productoSearchForPdv";
import { TipoPrecio } from "../../tipo-precio/tipo-precio.model";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Inject,
  HostListener,
} from "@angular/core";
import { FormGroup, FormControl } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from "@angular/material/dialog";
import { MatSort } from "@angular/material/sort";
import { MainService } from "../../../../main.service";
import { TecladoNumericoComponent } from "../../../../shared/components/teclado-numerico/teclado-numerico.component";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Producto } from "../producto.model";
import { ProductoService } from "../producto.service";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { off } from "process";
import { Presentacion } from "../../presentacion/presentacion.model";
import { PrecioPorSucursal } from "../../precio-por-sucursal/precio-por-sucursal.model";
import {
  ProductoCategoriaDialogComponent,
  ProductoCategoriaDialogData,
} from "../../../pdv/comercial/venta-touch/producto-categoria-dialog/producto-categoria-dialog.component";
import { SelectPrecioDialogComponent } from "../../precio-por-sucursal/select-precio-dialog/select-precio-dialog.component";
import { MovimientoStockService } from "../../../operaciones/movimiento-stock/movimiento-stock.service";
import { ProductoComponent } from "../edit-producto/producto.component";

export interface PdvSearchProductoData {
  texto?: any;
  cantidad?: number;
  tiposPrecios?: TipoPrecio[];
  selectedTipoPrecio?: TipoPrecio;
  mostrarOpciones?: boolean;
  mostrarStock?: boolean;
  conservarUltimaBusqueda?: boolean;
  costo?: boolean;
  transferencia?: Transferencia;
}

export interface PdvSearchProductoResponseData {
  producto: Producto;
  presentacion: Presentacion;
  precio?: PrecioPorSucursal;
  cantidad?: number;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { environment } from "../../../../../environments/environment";
import { Transferencia } from "../../../operaciones/transferencia/transferencia.model";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-pdv-search-producto-dialog",
  templateUrl: "./pdv-search-producto-dialog.component.html",
  styleUrls: ["./pdv-search-producto-dialog.component.css"],
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
export class PdvSearchProductoDialogComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild("tableRows", { static: false, read: ElementRef })
  tableElement: ElementRef<HTMLElement>;
  @ViewChild("presentacionCard", { static: false, read: ElementRef })
  presentacionCardElement: ElementRef<HTMLElement>;
  @ViewChild("buscarInput", { static: false }) buscarInput: ElementRef;

  selectedRowIndex = -1;
  selectedPresentacionRowIndex = -1;
  selectedPrecioRowIndex = -1;
  selectedRow: any;
  formGroup: FormGroup;
  dataSource: MatTableDataSource<Producto>;
  productos: Producto[];
  selectedPrecio: PrecioPorSucursal;
  displayedColumns: string[] = [
    "id",
    "descripcion",
    "codigo",
    // "acciones"
  ];
  expandedProducto: Producto | null;
  NumberUtils;
  sucursalActual: Sucursal;
  sucursalActualIndex: number;
  tiposPrecios: TipoPrecio[];
  selectedTipoPrecio: TipoPrecio;
  isSearching = false;
  onSearchTimer;
  productoDetailList: Producto[];
  mostrarTipoPrecios = false;
  desplegarTipoPrecios = false;
  selectedPresentacion: Presentacion;
  precios: string[];
  modoPrecio: string;
  isTransferencia: boolean = false;
  existenciaOrigen: number = 0;
  existenciaDestino: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PdvSearchProductoData,
    public dialogRef: MatDialogRef<PdvSearchProductoDialogComponent>,
    public mainService: MainService,
    private matDialog: MatDialog,
    private getProducto: ProductoForPdvGQL,
    private productoService: ProductoService,
    private _el: ElementRef,
    private stockService: MovimientoStockService
  ) {
    if (data?.mostrarStock == true) {
      this.displayedColumns = [
        "id",
        "descripcion",
        "codigo",
        "existencia",
        // "acciones"
      ];
      this.precios = environment["precios"];
      this.modoPrecio = environment["modo"];
    }
  }

  ngOnInit(): void {
    this.createForm();

    this.productoDetailList = [];

    if (this.data.conservarUltimaBusqueda == true) {
      this.formGroup
        .get("buscarControl")
        .setValue(this.productoService.lastSearchText);
    }

    if (this.data?.transferencia != null) {
      this.isTransferencia = true;
    } else {
      this.isTransferencia = false;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.buscarInput.nativeElement.focus();
    }, 300);
    this.dataSource = new MatTableDataSource<Producto>([]);
  }

  createForm() {
    this.formGroup = new FormGroup({
      buscarControl: new FormControl(null),
      cantidad: new FormControl(null),
    });

    this.formGroup
      .get("buscarControl")
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((value) => {
        if (value != null) this.onSearchProducto(value);
      });

    this.formGroup.get("buscarControl").setValue(this.data?.texto);
    this.formGroup.get("cantidad").setValue(this.data?.cantidad);
  }

  onSearchProducto(text: string, offset?: number) {
    let isPesable = false;
    let peso;
    let codigo;
    this.isSearching = true;
    if (this.data.conservarUltimaBusqueda == true)
      this.productoService.lastSearchText = text;
    if (this.onSearchTimer != null) {
      clearTimeout(this.onSearchTimer);
    }
    if (text == "" || text == null || text == " ") {
      this.dataSource != undefined ? (this.dataSource.data = []) : null;
      this.isSearching = false;
    } else {
      if (text.length == 13 && text.substring(0, 2) == "20") {
        isPesable = true;
        codigo = text.substring(2, 7);
        peso = +text.substring(7, 12) / 1000;
        text = codigo;
        this.formGroup.get("cantidad").setValue(peso);
      }
      this.onSearchTimer = setTimeout(() => {
        this.productoService
          .onSearch(text, offset, true)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (offset == null) {
              this.dataSource.data = res;
            } else {
              const arr = [...this.dataSource.data.concat(res)];
              this.dataSource.data = arr;
            }
            this.buscarInput.nativeElement.focus();
            this.isSearching = false;
          });
      }, 1000);
    }
  }

  highlight(index: number) {
    if (index >= 0 && index <= this.dataSource.data.length - 1) {
      this.selectedRowIndex = index;
      // this.expandedProducto = this.dataSource.data[index];
      // this.getProductoDetail(this.expandedProducto, index);
    }
  }

  highlightPresentacion(index: number) {
    if (index < 0) {
      this.selectedPresentacionRowIndex++;
    } else if (
      index >
      this.dataSource.data[this.selectedRowIndex]?.presentaciones?.length - 1
    ) {
      this.selectedPresentacionRowIndex--;
    } else {
      this.selectedPresentacionRowIndex = index;
      if (this.dataSource.data != null) {
        this.selectedPresentacion =
          this.dataSource?.data[this.selectedRowIndex]?.presentaciones[index];
        if (this.selectedPresentacion?.precios?.length > 0)
          this.selectedPrecio = this.selectedPresentacion?.precios[0];
      }
    }
  }

  getProductoDetail(producto: Producto, index) {
    if (producto?.presentaciones == null) {
      this.productoService
        .getProducto(producto.id)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (this.precios != null && this.modoPrecio == "ONLY") {
            res.presentaciones = res.presentaciones.filter((p, index) => {
              res.presentaciones[index].precios = p.precios?.filter((pre) =>
                this.precios?.includes(pre?.tipoPrecio?.descripcion)
              );
              return res.presentaciones[index].precios?.length > 0;
            });
          }
          if (this.precios != null && this.modoPrecio == "MIXTO") {
            res.presentaciones = res.presentaciones.filter((p, index) => {
              let foundPrecios = p.precios?.filter((pre) =>
                this.precios?.includes(pre?.tipoPrecio?.descripcion)
              );
              if (foundPrecios.length > 0) {
                res.presentaciones[index].precios = foundPrecios;
              }
              return true;
            });
          } else if (this.precios != null && this.modoPrecio == "NOT") {
            res.presentaciones = res.presentaciones?.filter((p, index) => {
              res.presentaciones[index].precios = p.precios?.filter(
                (pre) => !this.precios?.includes(pre?.tipoPrecio?.descripcion)
              );
              return res.presentaciones[index].precios?.length > 0;
            });
          }
          this.dataSource.data[index].presentaciones = res.presentaciones;
          this.highlightPresentacion(0);
        });
    }
  }

  scroll(id) {
    let el = document.getElementById(id);
    el.scrollIntoView();
  }

  tableKeyDownEvent(key, index) {
    switch (key) {
      case "ArrowDown":
        this.highlight(index + 1);
        this.expandedProducto = null;
        // this.highlightPresentacion(0);
        break;
      case "ArrowUp":
        this.highlight(index - 1);
        this.expandedProducto = null;
        // this.highlightPresentacion(0);
        break;
      case "Enter":
        if (this.expandedProducto == null) {
          this.expandedProducto = this.dataSource.data[index];
          this.getProductoDetail(this.expandedProducto, index);
        } else {
          this.onPresentacionClick(
            this.dataSource.data[index]?.presentaciones[
              this.selectedPresentacionRowIndex
            ],
            this.dataSource.data[index],
            null
          );
        }
        break;
      case "ArrowRight":
        if (this.selectedPresentacionRowIndex == -1) {
          this.highlightPresentacion(0);
        } else {
          this.selectedPresentacionRowIndex++;
          this.highlightPresentacion(this.selectedPresentacionRowIndex);
        }
        break;
      case "ArrowLeft":
        if (this.selectedPresentacionRowIndex == -1) {
          this.highlightPresentacion(0);
        } else {
          this.selectedPresentacionRowIndex--;
          this.highlightPresentacion(this.selectedPresentacionRowIndex);
        }
        break;
      default:
        if (!isNaN(+key)) {
          let precio = this.selectedPresentacion.precios?.find(
            (p) => p?.tipoPrecio?.id == key
          );
          this.onPresentacionClick(
            this.selectedPresentacion,
            this.dataSource.data[this.selectedRowIndex],
            precio
          );
        }
        break;
    }
  }

  setFocustEvent() {
    setTimeout(() => {
      // this will make the execution after the above boolean has changed
      if (this.tableElement != undefined) {
        this.tableElement.nativeElement.focus();
      }
    }, 100);
  }

  keydownEvent(e) {
    if (e == "ArrowDown" || e == "Tab") {
      if (this.dataSource.data?.length > 0) {
        this.highlight(0);
        this.setFocustEvent();
      }
    } else if (e == "Enter") {
      this.onSearchProducto(this.formGroup.controls.buscarControl.value);
    }
  }

  isNumber(val): boolean {
    return typeof val === "number";
  }

  getExistencia(producto: Producto): number {
    return producto?.sucursales?.find(
      (s) => s.sucursal.id == this.sucursalActual.id
    ).existencia;
  }

  cambiarTipoPrecio(tipo) {
    this.selectedTipoPrecio = this.tiposPrecios.find((tp) => tp.id == tipo);
  }

  openTecladoNumerico() {
    let dialog = this.matDialog.open(TecladoNumericoComponent, {
      data: {
        numero: this.formGroup.get("cantidad").value,
      },
    });
    dialog
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res > 0) {
          this.formGroup.get("cantidad").setValue(res);
        }
      });
  }

  @HostListener("document:keydown", ["$event"]) onKeydownHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case "Escape":
        break;
      case "Enter":
        break;
      default:
      case "ArrowDown":
        break;
      case "ArrowUp":
        break;
      case "F1":
        this.mostrarTipoPrecios = true;
        break;
        break;
    }
  }

  cargarMasDatos() {
    this.onSearchProducto(
      this.formGroup.controls.buscarControl.value,
      this.dataSource.data.length
    );
  }

  onPresentacionClick(
    presentacion?: Presentacion,
    producto?: Producto,
    precio?: PrecioPorSucursal
  ) {
    presentacion.producto = producto;
    if (precio == null && presentacion?.precios != null) {
      precio = this.selectedPrecio;
    }
    let response: PdvSearchProductoResponseData = {
      producto,
      presentacion,
      cantidad: this.formGroup.controls.cantidad.value,
      precio,
    };

    if (producto != null && presentacion != null && precio != null) {
      this.dialogRef.close(response);
    }
  }

  onMostrarTipoPrecios(presentacion: Presentacion) {
    this.desplegarTipoPrecios = true;
    this.selectedPresentacion = presentacion;
  }

  presentacionArrowRightEvent(index, el?) {
    this.highlightPresentacion(index + 1);
  }

  presentacionArrowLeftEvent(index, el) {
    this.highlightPresentacion(index - 1);
  }

  setCantidad(i) {
    let cantidad = this.formGroup.controls.cantidad.value;
    if (cantidad == 1) {
      this.formGroup.controls.cantidad.setValue(i);
    } else {
      this.formGroup.controls.cantidad.setValue(cantidad + i);
    }
  }

  mostrarStock(producto: Producto, index?) {
    if (this.isTransferencia) {
      this.productoService
        .onGetStockPorProductoAndSucursal(
          producto.id,
          this.data.transferencia.sucursalOrigen.id
        )
        .subscribe((stock) => {
          if (stock != null) {
            producto.stockPorProducto = stock;
            this.dataSource[index] = producto;
          }
        });
      this.productoService
        .onGetStockPorProductoAndSucursal(
          producto.id,
          this.data.transferencia.sucursalDestino.id
        )
        .subscribe((stock) => {
          if (stock != null) {
            producto.stockPorProductoDestino = stock;
            this.dataSource[index] = producto;
          }
        });
    } else {
      this.stockService
        .onGetStockPorProducto(producto.id)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            producto.stockPorProducto = res;
            this.dataSource[index] = producto;
          }
        });
    }
  }

  mostrarCodigoPrincipal(producto: Producto, index?) {
    this.stockService
      .onGetStockPorProducto(producto.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          producto.stockPorProducto = res;
          this.dataSource[index] = producto;
        }
      });
  }

  abrirProductoDialog(producto?: Producto) {
    this.matDialog
      .open(ProductoComponent, {
        data: {
          isDialog: true,
          producto: producto,
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = [];
          this.onSearchProducto(res.descripcion, 0);
        }
      });
  }
}
