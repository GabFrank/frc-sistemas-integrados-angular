import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductoService } from '../producto.service';
import { MatSort } from '@angular/material/sort';
import { Producto } from '../producto.model';
import { animate, trigger, state, style, transition } from '@angular/animations';
import { MainService } from '../../../../main.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';


export interface DialogData {
  texto: string;
  data: any;
  query: any;
  proveedorId: number;
}

export interface ProductoExistenciaCosto {
  
}

@Component({
  selector: 'app-search-producto-dialog',
  templateUrl: './search-producto-dialog.component.html',
  styleUrls: ['./search-producto-dialog.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class SearchProductoDialogComponent implements OnInit{

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild('tableRows', {static: false, read: ElementRef}) tableElement: ElementRef<HTMLElement>;


  selectedRowIndex: any;
  selectedRow: any;
  formGroup;
  dataSource : [Producto];
  productos: Producto[];
  displayedColumns: string[] = ['id', 'descripcion', 'existencia', 'precioUltimaCompra', 'cantidadUltimaCompra'];
  displayedColumnsAttr: boolean[] = [null, null, null, true, true]
  displayedColumnsSucursalExistencia: string[] = ['sucursal', 'existencia', 'cantidadUltimaCompra', 'fechaUltimaCompra', 'proveedor'];
  expandedProducto: Producto | null;
  NumberUtils;
  sucursalActual : Sucursal;
  sucursalActualIndex: number;
  isSearching = false;
  onSearchTimer;

  constructor(
    public service: ProductoService,
    public dialogRef: MatDialogRef<SearchProductoDialogComponent>,
    public mainService: MainService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
      this.sucursalActual = mainService.sucursalActual;
    }

  ngOnInit(): void {
    this.formGroup = new FormGroup(
      {
        buscarControl: new FormControl(),
      }
    );
    this.formGroup.get('buscarControl').value = this.data.texto;

    this.service.datosSub.subscribe(datos => {
      this.dataSource = datos as [Producto];
      this.selectedRowIndex = null;
      this.dataSource?.length>0 ? this.sucursalActualIndex = this.dataSource[0].sucursales.findIndex((pis)=>pis.sucursal.nombre == this.sucursalActual.nombre) : null;
    });
    this.onBuscarChange();
  }

  onBuscarChange(): void {
    if(this.data.proveedorId!=null){
      // this.service.onSearch(this.formGroup.get('buscarControl').value, this.data.query, this.sort, this.data.proveedorId);
    } else {
      // this.service.onSearch(this.formGroup.get('buscarControl').value, this.data.query, this.sort, null);
    }
  }

  highlight(row: any, i?){
    this.selectedRow = row;
    this.selectedRowIndex = i;
  }

   arrowUpEvent(){
     if(this.selectedRowIndex>0){
      this.selectedRowIndex--;
      var nextrow = this.dataSource[this.selectedRowIndex];
     }
    this.highlight(nextrow, this.selectedRowIndex);
  }

  arrowDownEvent(){
    if(this.selectedRowIndex < this.dataSource?.length - 1){
      this.selectedRowIndex++;
      var nextrow = this.dataSource[this.selectedRowIndex];
     }
    this.highlight(nextrow, this.selectedRowIndex);
  }

  selectRowEvent(isRow, row){
    if(isRow){
      this.dialogRef.close(this.selectedRow);
    } else {
      this.expandedProducto = row;
    }
  }

  setFocustEvent(){
    setTimeout(()=>{ // this will make the execution after the above boolean has changed
      if(this.tableElement!=undefined){
        this.tableElement.nativeElement.focus();  
      } 
    },100);
  }

  keydownEvent(e: KeyboardEvent){
    if(e.key == 'ArrowDown' || e.key == 'Enter' || e.key == 'Tab'){
      if(this.dataSource.length > 0){
        console.log(this.dataSource[0], 0)
        this.highlight(this.dataSource[0], 0);
        this.setFocustEvent();
      }
    }
  }

  isNumber(val): boolean { 
    return typeof val === 'number'; 
  }

}

