import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { SelectionModel } from "@angular/cdk/collections";
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { Product } from "electron/main";
import { environment } from "../../../../../environments/environment";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { transitionRightToLeftAnimation } from "../../../../shared/components/panel-laterial-invisible/panel-right-animation";
import { Codigo } from "../../codigo/codigo.model";
import { PrecioPorSucursal } from "../../precio-por-sucursal/precio-por-sucursal.model";
import { ProductoComponent } from "../edit-producto/producto.component";
import { Producto } from "../producto.model";
import { ProductoService } from "../producto.service";

interface ProductoDatasource {
  id: number;
  descripcion: string;
  precio1: number;
  precio2: number;
  precio3: number;
}

@Component({
  selector: "app-list-producto",
  templateUrl: "./list-producto.component.html",
  styleUrls: ["./list-producto.component.css"],
  animations: [
    trigger("slideInOut", [
      state(
        "in",
        style({
          transform: "translate3d(0,0,0)",
        })
      ),
      state(
        "out",
        style({
          transform: "translate3d(100%, 0, 0)",
        })
      ),
      transition("in => out", animate("400ms ease-in-out")),
      transition("out => in", animate("400ms ease-in-out")),
    ]),
  ],
})
export class ListProductoComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('buscarInput', {static: true}) buscarInput: ElementRef;

  // la fuente de datos de la tabla
  dataSource = new MatTableDataSource(null);

  //controladores
  buscarField = new FormControl("");

  //producto seleccionado
  selectedProducto = new Producto();

  selectedRowIndex;

  menuState: string = "out";

  isSearching = false;

  onSearchTimer;

  displayedColumnsId: string[] = [
    "id",
    "descripcion",
    "precio1",
    "precio2",
    "precio3",
  ];
  displayedColumns: string[] = [
    "id",
    "descripcion",
    "precio1",
    "precio2",
    "precio3",
  ];

  constructor(
    public service: ProductoService,
    private tabService: TabService
  ) {}

  ngOnInit(): void {
    // subscripcion a los datos de productos
    this.service.datosSub.subscribe((res) => {
      let pdsList: ProductoDatasource[] = [];
      this.isSearching = false;
      res?.forEach((p) => {
        let pds: ProductoDatasource = {
          id: p.id,
          descripcion: p.descripcion,
          precio1:
            p?.precio1?.preciosPorSucursal.find(
              (p) => p.sucursal?.id == environment.sucursalId
            )?.precio * p?.precio1?.cantidad,
          precio2:
            p?.precio2?.preciosPorSucursal.find(
              (p) => p.sucursal?.id == environment.sucursalId
            )?.precio * p?.precio2?.cantidad,
          precio3:
            p?.precio3?.preciosPorSucursal.find(
              (p) => p.sucursal?.id == environment.sucursalId
            )?.precio * p?.precio3?.cantidad,
        };
        pdsList.push(pds);
      });
      this.dataSource.data = pdsList;
    });

    //listener para el campo buscar
    this.buscarField.valueChanges.subscribe((res) => {
      this.onSearchChange(res);
    });

    setTimeout(() => {
      this.buscarInput.nativeElement.focus()
    }, 100);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  createForm() {}

  onSearchChange(text: string) {
    this.isSearching = true;
    if (this.onSearchTimer != null) {
      clearTimeout(this.onSearchTimer);
    }
    if (text == "" || text == null || text == " ") {
      this.dataSource.data = [];
      this.isSearching = false;
    } else {
      this.onSearchTimer = setTimeout(() => {
        this.service.onSearch(text);
      }, 1000);
    }
  }

  onRowClick(row) {
    this.service.getProducto(row.id).subscribe((res) => {
      if (res != null) {
        if (this.menuState === "in") {
          this.menuState = "out";
          setTimeout(() => {
            this.menuState = "in";
            this.selectedProducto = res;
          }, 500);
        } else {
          this.selectedProducto = res;
          this.menuState = "in";
        }
      }
    });
  }

  openProductos(tipo) {
    switch (tipo) {
      case "new":
        this.tabService.addTab(
          new Tab(
            ProductoComponent,
            "Nuevo Producto",
            null,
            ListProductoComponent
          )
        );
        break;
      case "edit":
        this.tabService.addTab(
          new Tab(
            ProductoComponent,
            this.selectedProducto.descripcion,
            { data: this.selectedProducto },
            ListProductoComponent
          )
        );
        break;

      default:
        break;
    }
  }

  @HostListener("window:keyup", ["$event"])
  keyEvent(event: KeyboardEvent) {
    let key = event.key;
    let isNumber = (+key).toString() === key;
    console.log(key);
    switch (key) {
      case "Enter":
        if (this.selectedProducto != null) {
          this.openProductos("edit");
        } else {
          // this.openProductos('new')
        }
        break;
      case "ArrowRight":
        if (this.paginator.pageIndex < this.paginator.length) {
          this.paginator.nextPage();
        }
        break;
      case "ArrowLeft":
        if (this.paginator.pageIndex > 0) {
          this.paginator.previousPage();
        }
        break;
      case "ArrowDown":
        if (this.selectedRowIndex ==null && this.dataSource.data.length > 0) {
          this.highlight(this.dataSource.data[0], 0)
        }
        break;
      default:
        break;
    }
  }

  highlight(row: any, i?){
    this.onRowClick(row)
    this.selectedRowIndex = i;
  }

  arrowUpEvent(){
    console.log(this.selectedRowIndex, this.paginator.pageSize)
    if(this.selectedRowIndex>0){
      // if(this.selectedRowIndex-1 == this.paginator.pageSize){
      //   this.paginator.nextPage()
      // }
     this.selectedRowIndex--;
     var nextrow = this.dataSource.data[this.selectedRowIndex];
     // this.expandedProducto = nextrow;
    }
   this.highlight(nextrow, this.selectedRowIndex);
 }

 arrowDownEvent(){
   console.log(this.selectedRowIndex, this.paginator.pageSize, this.dataSource?.data.length - 1)
   if(this.selectedRowIndex < this.dataSource?.data.length - 1){
     if(this.selectedRowIndex+1 == this.paginator.pageSize){
       this.paginator.nextPage()
     }
     this.selectedRowIndex++;
     var nextrow = this.dataSource.data[this.selectedRowIndex];
     // this.expandedProducto = nextrow;
    }
   this.highlight(nextrow, this.selectedRowIndex);
 }
}
