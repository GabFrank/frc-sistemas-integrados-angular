import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { environment } from "../../../../../environments/environment";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
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
})
export class ListProductoComponent implements OnInit {
  // la fuente de datos de la tabla
  dataSource = new MatTableDataSource(null);

  //controladores
  buscarField = new FormControl("");

  //producto seleccionado
  selectedProducto = new Producto()

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
        console.log(p);
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
      console.log(pdsList);
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
    console.log('hola')
    this.service.getProducto(row.id).subscribe(res => {
      if(res!=null){
        this.selectedProducto = res;
        console.log(this.selectedProducto)
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
