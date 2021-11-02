import { SelectionModel } from '@angular/cdk/collections';
import { ViewChildren } from '@angular/core';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatTable } from '@angular/material/table';
import { SucursalByIdGQL } from '../../../../modules/empresarial/sucursal/graphql/sucursalById';
import { SucursalesGQL } from '../../../../modules/empresarial/sucursal/graphql/sucursalesQuery';
import { SucursalesSearchGQL } from '../../../../modules/empresarial/sucursal/graphql/sucursalesSearch';
import { Sucursal } from '../../../../modules/empresarial/sucursal/sucursal.model';
import { ProductoPorIdGQL } from '../../../../modules/productos/producto/graphql/productoPorId';
import { Producto } from '../../../../modules/productos/producto/producto.model';
import { SearchProductoDialogComponent } from '../../../../modules/productos/producto/search-producto-dialog/search-producto-dialog.component';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NecesidadInput } from '../necesidad-input.model';
import { NecesidadService } from '../necesidad.service';

class NecesidadProducto {
  id: number;
  producto: Producto;
  nombreProducto: string;
  cantidad: number;
  frio: boolean
}

@Component({
  selector: 'app-edit-necesidad',
  templateUrl: './edit-necesidad.component.html',
  styleUrls: ['./edit-necesidad.component.css']
})
export class EditNecesidadComponent implements OnInit {

  @Input() data;
  @ViewChild('autoSucursalInput', { static: false, read: MatAutocompleteTrigger }) matSucursalTrigger: MatAutocompleteTrigger;
  @ViewChild('autoSucursalInput', { static: false }) autoSucursalInput: ElementRef;
  @ViewChild('cantidadProducto', { static: true, read: ElementRef }) cantidadProductoEL: ElementRef;
  @ViewChild('codigoProducto', { static: true, read: ElementRef }) codigoProductoEL: ElementRef;
  @ViewChild('frio', { static: false, read: ElementRef }) frio: ElementRef;
  @ViewChildren(MatTable) _matTables


  necesidadInput: NecesidadInput
  formGroup: FormGroup;
  sucursales: Sucursal[] = [];
  isSucursalesDataReady = false;
  selectedSucursal: Sucursal;
  today: Date;
  selectedProducto: Producto;
  frioChecked: Boolean = false;
  sucursalId = 1;
  productosList: NecesidadProducto[];
  displayedColumnsProducto = ['select', 'id', 'nombreProducto', 'cantidad', 'frio'];
  cantidadItens = 0;
  selection = new SelectionModel<NecesidadProducto>(true, []);
  isRowSelected = false;



  constructor(
    private service: NecesidadService,
    private sucursalesSearch: SucursalesSearchGQL,
    private sucursalById: SucursalByIdGQL,
    private productoById: ProductoPorIdGQL,
    private allSucursales: SucursalesGQL,
    public dialog: MatDialog,
    public dialogService : DialogosService,
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.getSucursales();
    this.formGroup.get('frio').setValue(false);
    this.today = new Date();
    this.formGroup.get('fecha').setValue(this.today);
    this.productosList = [];
    setTimeout(() => {
      this.codigoProductoEL.nativeElement.focus();
    }, 100);
  }

  createForm(): void {
    this.formGroup = new FormGroup({
      sucursal: new FormControl(null, Validators.required),
      fecha: new FormControl(null, Validators.required),
      estado: new FormControl(null),
      fechaDeEntrega: new FormControl(null),
      formaPago: new FormControl(null),
      usuario: new FormControl(null),
      codigoProducto: new FormControl(null, Validators.required),
      producto: new FormControl(null, Validators.required),
      cantidadProducto: new FormControl(null, Validators.required),
      frio: new FormControl(null)
    });
  }

  resetForm(){
    this.formGroup.get('codigoProducto').reset();
    this.formGroup.get('producto').reset();
    this.formGroup.get('cantidadProducto').reset();
    this.formGroup.get('frio').setValue(false);
  }

  getSucursales(){
    this.allSucursales.fetch().subscribe((data)=>{
      if(data.errors){
        console.log("error al obtener sucursales");
      } else {
        this.sucursales = data.data;
        setTimeout(() => {
          this.isSucursalesDataReady = true;
        }, 100);
        this.selectedSucursal = this.sucursales[0];
        this.formGroup.get('sucursal').setValue(this.selectedSucursal.id);
      }
    });
  }

  onSucursalSearch(sucursal?: Sucursal): void {
    if (sucursal != undefined ) {
      this.sucursalById.fetch(
        {
          id: this.sucursalId
        },
        {
          fetchPolicy: 'no-cache'
        }
      ).subscribe((data) => {
        const sucursal: Sucursal = data.data.data;
        this.selectedSucursal = sucursal;
        this.sucursales.push(sucursal);
        this.formGroup.get('sucursal').setValue(sucursal.id);
      })
    } else {
      if (this.formGroup.get('sucursal').value != null || this.formGroup.get('sucursal').value != '') {
        this.sucursalesSearch.fetch(
          {
            texto: this.formGroup.get('sucursal').value
          },
          {
            fetchPolicy: 'no-cache'
          }
        ).subscribe((data) => {
          this.sucursales = data.data.data;
          if (this.sucursales.length == 1) {
            setTimeout(() => {
              this.formGroup.get('sucursal').setValue(this.sucursales[0].id);
              this.autoSucursalInput.nativeElement.select();
              this.matSucursalTrigger.closePanel();
            }, 1000);
          }
        });
      }
    }
  }

  displaySucursal(value?: number) {
    let res = value ? this.sucursales.find(_ => _.id === value) : undefined;
    return res ? res.id + " - " + res.nombre : undefined;
  }

  onSucursalAutoClosed(){
    this.autoSucursalInput.nativeElement.select();
  }

  onSubmit() {

  }

  openDialog(e: Event): void {
    const dialogRef = this.dialog.open(SearchProductoDialogComponent, {
      data: {texto: (e.target as HTMLInputElement).value}
    });

    dialogRef.afterClosed().subscribe(result => {
      this.selectedProducto = result as Producto;
      if(this.selectedProducto!=null){
        this.formGroup.get('codigoProducto').setValue(this.selectedProducto.id);
        this.formGroup.get('producto').setValue(this.selectedProducto.descripcion);
        this.frio.nativeElement.focus();
      }
    });
  }

  onCantidadConfirm(e){
    if(!this.formGroup.valid)
    return   
    if(e == 'ArrowDown' || e == 'Enter'){
      this.dialogService.confirm('Desea adicionar este producto?', `DESCRIPCION: ${this.selectedProducto.descripcion}`, `CANTIDAD: ${this.formGroup.get('cantidadProducto').value}`).subscribe((result)=>{
        if(result){
          let necesidadProducto : NecesidadProducto = new NecesidadProducto();
          necesidadProducto.id = this.productosList.length + 1;
          necesidadProducto.producto = this.selectedProducto;
          necesidadProducto.nombreProducto = this.selectedProducto.descripcion;
          necesidadProducto.cantidad = this.formGroup.get('cantidadProducto').value;
          necesidadProducto.frio = this.formGroup.get('frio').value;          
          this.productosList[this.productosList.length] = necesidadProducto;
          this.resetForm();
          this.codigoProductoEL.nativeElement.focus(); 
          this._matTables['_results'][0].renderRows();
        }
      });
    }
  }

  onCodigoKeyEvent(e: KeyboardEvent){
    if(e.key == 'ArrowDown' || e.key == 'Enter' || e.key == 'Tab'){
      this.buscarProductoPorId(this.formGroup.get('codigoProducto').value);
    }
  }

  buscarProductoPorId(id){
    if(id!=null){
      this.productoById.fetch(
        {
          id: id
        },
        {
          fetchPolicy: 'no-cache'
        }
      ).subscribe((data)=>{
        if(data.errors){
        } else {
        this.selectedProducto = data.data.data;
        this.formGroup.get('codigoProducto').setValue(this.selectedProducto.id);
        this.formGroup.get('producto').setValue(this.selectedProducto.descripcion);
        this.cantidadProductoEL.nativeElement.focus();
        }
      })
    }
  }

  togleCheckboxFrio(){
    let check = this.formGroup.get('frio').value;
    this.formGroup.get('frio').setValue(!check);
  }

  onTabEventCheckBox(){
    this.onCantidadConfirm(new KeyboardEvent('Enter',));
  }

  //funciones del seleccionador de tabla producto
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.productosList.length;

    //show and hide eliminar
    if(this.selection.selected.length>0){
        this.isRowSelected = true;
    } else {
      setTimeout(() => {
        this.isRowSelected = false;
      }, 0);    }
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.productosList.forEach(row => this.selection.select(row));        
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: NecesidadProducto): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id + 1}`;
  }

}
