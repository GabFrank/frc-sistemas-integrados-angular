import { trigger, state, style, transition, animate } from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
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
    trigger('slideInOut', [
      state('in', style({
        transform: 'translate3d(0,0,0)'
      })),
      state('out', style({
        transform: 'translate3d(100%, 0, 0)'
      })),
      transition('in => out', animate('400ms ease-in-out')),
      transition('out => in', animate('400ms ease-in-out'))
    ])
  ]
})
export class ListProductoComponent implements OnInit {
  // la fuente de datos de la tabla
  dataSource = new MatTableDataSource(null);

  //controladores
  buscarField = new FormControl("");

  //producto seleccionado
  selectedProducto = new Producto()

  menuState:string = 'out';

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

  constructor(public service: ProductoService, private tabService: TabService) {}

  ngOnInit(): void {
    // subscripcion a los datos de productos
    this.service.datosSub.subscribe((res) => {
      let pdsList: ProductoDatasource[] = [];
      res?.forEach((p) => {
        let pds: ProductoDatasource = {
          id: p.id,
          descripcion: p.descripcion,
          precio1: p?.precio1?.preciosPorSucursal.find(
            (p) => p.sucursal?.id == environment.sucursalId
          )?.precio,
          precio2: p?.precio2?.preciosPorSucursal.find(
            (p) => p.sucursal?.id == environment.sucursalId
          )?.precio,
          precio3: p?.precio3?.preciosPorSucursal.find(
            (p) => p.sucursal?.id == environment.sucursalId
          )?.precio,
        };
        pdsList.push(pds);
      });
      this.dataSource.data = pdsList;
    });

    //listener para el campo buscar
    this.buscarField.valueChanges.subscribe((res) => {
      this.onSearchChange(res);
    });
  }

  createForm() {}

  onSearchChange(text: string) {
    this.service.onSearch(text);
  }

  onRowClick(row){
    this.service.getProducto(row.id).subscribe(res => {
      if(res!=null){
        if(this.menuState === 'in'){
          this.menuState = 'out';
          setTimeout(() => {
            this.menuState = 'in';
            this.selectedProducto = res;
          }, 500);
        } else {
          this.selectedProducto = res;
          this.menuState = 'in';
        }     
      }
    })
  }

  openProductos(tipo){
    switch (tipo) {
      case 'new':
        this.tabService.addTab(new Tab(ProductoComponent, 'Nuew Producto', null, ListProductoComponent))
        break;
      case 'edit':
        this.tabService.addTab(new Tab(ProductoComponent, this.selectedProducto.descripcion, {data: this.selectedProducto}, ListProductoComponent))
        break;
    
      default:
        break;
    }
  }


}
