
import { ProductoForPdvGQL } from '../graphql/productoSearchForPdv';
import { TipoPrecio } from '../../tipo-precio/tipo-precio.model';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, HostListener } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MainService } from '../../../../main.service';
import { TecladoNumericoComponent } from '../../../../shared/components/teclado-numerico/teclado-numerico.component';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { Producto } from '../producto.model';

export interface PdvSearchProductoData {
  texto: any;
  cantidad: number;
  tiposPrecios?: TipoPrecio[];
  selectedTipoPrecio?: TipoPrecio;
}

export interface PdvSearchProductoResponseData {
  producto: Producto;
  tipoPrecio: TipoPrecio;
  cantidad: number;
}


@Component({
  selector: 'app-pdv-search-producto-dialog',
  templateUrl: './pdv-search-producto-dialog.component.html',
  styleUrls: ['./pdv-search-producto-dialog.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class PdvSearchProductoDialogComponent implements OnInit, AfterViewInit{

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild('tableRows', {static: false, read: ElementRef}) tableElement: ElementRef<HTMLElement>;
  @ViewChild('buscarInput',{static: false}) buscarInput: ElementRef;


  selectedRowIndex: any;
  selectedRow: any;
  formGroup : FormGroup;
  dataSource : Producto[];
  productos: Producto[];
  displayedColumns: string[] = ['id', 'descripcion', 'promocion', 'precio1', 'precio2', 'precio3', 'existencia'];
  expandedProducto: Producto | null;
  NumberUtils;
  sucursalActual : Sucursal;
  sucursalActualIndex: number;
  tiposPrecios: TipoPrecio[];
  selectedTipoPrecio: TipoPrecio;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PdvSearchProductoData,
    public dialogRef: MatDialogRef<PdvSearchProductoDialogComponent>,
    private mainService: MainService,
    private matDialog: MatDialog,
    private getProducto: ProductoForPdvGQL,
    ) {
      this.sucursalActual = mainService.sucursalActual;
      this.selectedTipoPrecio = data?.selectedTipoPrecio;
      this.tiposPrecios = data?.tiposPrecios;
    }
  
  

  ngOnInit(): void {
    this.createForm();

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.buscarInput.nativeElement.focus()
    }, 100);
  }

  createForm(){
    this.formGroup = new FormGroup(
      {
        buscarControl: new FormControl(null),
        cantidad: new FormControl(null)
      }
    );

    this.formGroup.get('buscarControl').valueChanges.subscribe((value)=>{
      if(value!=null && value!=''){
        this.getProducto.fetch({
          texto: value
        }).subscribe(res => {
          this.dataSource = res.data.data;
          this.selectedRowIndex = null;
        });
      }
    });

    this.formGroup.get('buscarControl').setValue(this.data?.texto);
    this.formGroup.get('cantidad').setValue(this.data?.cantidad)
  }

  highlight(row: any, i?){
    this.selectedRow = row;
    this.selectedRowIndex = i;
    this.expandedProducto = row;
  }

  arrowUpEvent(){
     if(this.selectedRowIndex>0){
      this.selectedRowIndex--;
      var nextrow = this.dataSource[this.selectedRowIndex];
      // this.expandedProducto = nextrow;
     }
    this.highlight(nextrow, this.selectedRowIndex);
  }

  arrowDownEvent(){
    if(this.selectedRowIndex < this.dataSource?.length - 1){
      this.selectedRowIndex++;
      var nextrow = this.dataSource[this.selectedRowIndex];
      // this.expandedProducto = nextrow;
     }
    this.highlight(nextrow, this.selectedRowIndex);
  }

  selectRowEvent(isRow){
      if(isRow){
        this.selectedRow = this.dataSource[this.selectedRowIndex];
        let response : PdvSearchProductoResponseData = {
          cantidad: this.formGroup.get('cantidad').value,
          tipoPrecio: this.selectedTipoPrecio,
          producto: this.selectedRow
        }
        this.dialogRef.close(response);
      } else {
        this.expandedProducto = this.dataSource[this.selectedRowIndex];
      }
    
  }

  setFocustEvent(){
    setTimeout(()=>{ // this will make the execution after the above boolean has changed
      if(this.tableElement!=undefined){
        this.tableElement.nativeElement.focus();  
      } 
    },100);
  }

  keydownEvent(e){
    if(e == 'ArrowDown' || e == 'Enter' || e == 'Tab'){
      if(this.dataSource.length > 0){
        this.highlight(this.dataSource[0], 0);
        this.expandedProducto = this.dataSource[0]
        this.setFocustEvent();
      }
    }
  }

  isNumber(val): boolean { 
    return typeof val === 'number'; 
  }

  getPrecio1(producto: Producto): Number {
    return producto?.precio1?.preciosPorSucursal?.find(pps => pps.sucursal.id == this.sucursalActual.id).precio;
  }

  getPrecio2(producto: Producto): Number {
    return producto?.precio2?.preciosPorSucursal?.find(pps => pps.sucursal.id == this.sucursalActual.id).precio;
  }

  getPrecio3(producto: Producto): Number {
    return producto?.precio3?.preciosPorSucursal?.find(pps => pps.sucursal.id == this.sucursalActual.id).precio;
  }

  getExistencia(producto: Producto): Number {
    return producto?.sucursales?.find(s => s.sucursal.id == this.sucursalActual.id).existencia
  }

  cambiarTipoPrecio(tipo){
    this.selectedTipoPrecio = this.tiposPrecios.find(tp => tp.id == tipo);
  }

  openTecladoNumerico(){
    let dialog = this.matDialog.open(TecladoNumericoComponent, {
      data: {
        numero: this.formGroup.get('cantidad').value
      }
    })
    dialog.afterClosed().subscribe((res)=>{
      if(res>0){
        this.formGroup.get('cantidad').setValue(res);
      }
    });
  }

  @HostListener('document:keydown', ['$event']) onKeydownHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case 'Escape':
        break;
      case 'Enter':
        this.keydownEvent(event.key)
        break;
      default:
        break;
    }
  }

}

