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
import { ProductoCategoriaDialogComponent, ProductoCategoriaDialogData } from "../../../pdv/comercial/venta-touch/producto-categoria-dialog/producto-categoria-dialog.component";

export interface PdvSearchProductoData {
  texto: any;
  cantidad: number;
  tiposPrecios?: TipoPrecio[];
  selectedTipoPrecio?: TipoPrecio;
}

export interface PdvSearchProductoResponseData {
  producto: Producto;
  presentacion: Presentacion;
  precio?: PrecioPorSucursal;
  cantidad?: number;
}

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
  @ViewChild("buscarInput", { static: false }) buscarInput: ElementRef;

  selectedRowIndex = -1;
  selectedRow: any;
  formGroup: FormGroup;
  dataSource: MatTableDataSource<Producto>;
  productos: Producto[];
  displayedColumns: string[] = [
    "id",
    "descripcion",
    "promocion",
    "precio1",
    "precio2",
    "precio3",
    "existencia",
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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PdvSearchProductoData,
    public dialogRef: MatDialogRef<PdvSearchProductoDialogComponent>,
    public mainService: MainService,
    private matDialog: MatDialog,
    private getProducto: ProductoForPdvGQL,
    private productoService: ProductoService
  ) {
    this.sucursalActual = mainService.sucursalActual;
    this.selectedTipoPrecio = data?.selectedTipoPrecio;
    this.tiposPrecios = data?.tiposPrecios;
  }

  ngOnInit(): void {
    this.createForm();

    this.productoDetailList = [];
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.buscarInput.nativeElement.focus();
    }, 100);
    this.dataSource = new MatTableDataSource<Producto>([]);
  }

  createForm() {
    this.formGroup = new FormGroup({
      buscarControl: new FormControl(null),
      cantidad: new FormControl(null),
    });

    this.formGroup.get("buscarControl").valueChanges.subscribe((value) => {
      this.onSearchProducto(value);
    });

    this.formGroup.get("buscarControl").setValue(this.data?.texto);
    this.formGroup.get("cantidad").setValue(this.data?.cantidad);
  }

  onSearchProducto(text: string, offset?: number) {
    this.isSearching = true;
    if (this.onSearchTimer != null) {
      clearTimeout(this.onSearchTimer);
    }
    if (text == "" || text == null || text == " ") {
      console.log("text is ", text);
      this.dataSource.data = [];
      this.isSearching = false;
    } else {
      this.onSearchTimer = setTimeout(() => {
        this.productoService.onSearch(text, offset).subscribe((res) => {
          if (res.errors == null) {
            if (offset == null) {
              console.log("offset es nulo");
              this.dataSource.data = res.data.data;
            } else {
              console.log("offset es: ", offset);
              const arr = [...this.dataSource.data.concat(res.data.data)];
              this.dataSource.data = arr;
            }
            this.isSearching = false;
          }
        });
      }, 1000);
    }
  }

  highlight(row: any, i?) {
    this.selectedRow = row;
    this.selectedRowIndex = i;
    this.expandedProducto = row;
    this.getProductoDetail(row, i);
  }

  getProductoDetail(producto: Producto, index) {
    if (producto?.presentaciones == null) {
      this.productoService.getProducto(producto.id).subscribe((res) => {
        console.log(res);
        this.dataSource.data[index].presentaciones = res.presentaciones;
      });
    }
  }

  arrowUpEvent() {
    if (this.selectedRowIndex > 0) {
      this.selectedRowIndex++;      
      var nextrow = this.dataSource.data[this.selectedRowIndex];
    }
    this.highlight(nextrow, this.selectedRowIndex);
  }

  arrowDownEvent() {
    console.log(this.selectedRowIndex, this.dataSource.data.length - 1)
    if (this.selectedRowIndex < this.dataSource.data?.length - 1) {
      this.selectedRowIndex++;
      var nextrow = this.dataSource.data[this.selectedRowIndex];
      console.log(this.selectedRowIndex, nextrow)
      // this.expandedProducto = nextrow;
    }
    this.highlight(nextrow, this.selectedRowIndex);
  }

  selectRowEvent(isRow) {
    if (isRow) {
      this.selectedRow = this.dataSource.data[this.selectedRowIndex];
    } else {
      this.expandedProducto = this.dataSource.data[this.selectedRowIndex];
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
    if (e == "ArrowDown" || e == "Enter" || e == "Tab") {
      if (this.dataSource.data?.length > 0) {
        this.highlight(this.dataSource.data[0], 0);
        this.setFocustEvent();
      }
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
    dialog.afterClosed().subscribe((res) => {
      if (res > 0) {
        this.formGroup.get("cantidad").setValue(res);
      }
    });
  }

  // @HostListener("document:keydown", ["$event"]) onKeydownHandler(
  //   event: KeyboardEvent
  // ) {
  //   switch (event.key) {
  //     case "Escape":
  //       break;
  //     case "Enter":
  //       this.keydownEvent(event.key);
  //       break;
  //     default:
  //     case "ArrowDown":
  //       break;
  //     case "ArrowUp":
  //       break;
  //       break;
  //   }
  // }

  cargarMasDatos() {
    this.onSearchProducto(
      this.formGroup.controls.buscarControl.value,
      this.dataSource.data.length
    );
  }

  onPresentacionClick(presentacion?: Presentacion, producto?: Producto, precio?: PrecioPorSucursal){
    let response : PdvSearchProductoResponseData = {
      producto,
      presentacion,
      cantidad: this.data.cantidad,
      precio
    }
    this.dialogRef.close(response)
  }

  onMostrarTipoPrecios(presentacion: Presentacion){
    this.desplegarTipoPrecios = true
    this.selectedPresentacion = presentacion
  }

}
