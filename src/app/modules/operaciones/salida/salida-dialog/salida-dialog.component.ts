import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { UsuarioService } from '../../../personas/usuarios/usuario.service';
import { Presentacion } from '../../../productos/presentacion/presentacion.model';
import { PdvSearchProductoDialogComponent, PdvSearchProductoResponseData } from '../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { Producto } from '../../../productos/producto/producto.model';
import { SalidaItem } from '../salida-item/salida-item.model';
import { SalidaItemService } from '../salida-item/salida-item.service';
import { Salida, TipoSalida, SalidaInput } from '../salida.model';
import { SalidaService } from '../salida.service';
export interface SalidaDialogData {
  id?: number;
  salida?: Salida;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-salida-dialog",
  templateUrl: "./salida-dialog.component.html",
  styleUrls: ["./salida-dialog.component.scss"],
})
export class SalidaDialogComponent implements OnInit {
  @ViewChild("responsableInput", { static: false }) responsableInput: ElementRef;
  @ViewChild("productoInput", { static: false }) productoInput: ElementRef;
  @ViewChild("cantidadInput", { static: false }) cantidadInput: ElementRef;
  @ViewChild("tipoSalidaSelect", { static: true })
  tipoSalidaSelect: MatSelect;

  selectedSalida: Salida;
  responsableCargaControl = new FormControl();
  tipoSalidaControl = new FormControl();
  sucursalControl = new FormControl();
  idControl = new FormControl();
  creadoEnControl = new FormControl();
  observacionControl = new FormControl();
  formGroup: FormGroup;
  usuarioInputControl = new FormControl();
  usuarioList: Usuario[];
  timer = null;
  selectedResponsable: Usuario;
  tipoSalidasList: any[];
  selectedTipoSalida: TipoSalida;
  sucursalList: Sucursal[];
  filteredSucursalList: Sucursal[];
  selectedSucursal: Sucursal;
  itemDataSource = new MatTableDataSource<SalidaItem>(null);
  displayedColumns = [
    "id",
    "producto",
    "codigo",
    "presentacion",
    "cantidad"  ];

  isEditar = true;
  isItemEditar = true;

  //salidaitem
  productoIdControl = new FormControl();
  productoControl = new FormControl(null, Validators.required);
  presentacionControl = new FormControl(null, Validators.required);
  cantidadControl = new FormControl(null, Validators.required);
  itemObservacionControl = new FormControl();
  itemFormGroup: FormGroup;
  selectedProducto: Producto;
  selectedPresentacion: Presentacion;
  selectedSalidaItem: SalidaItem;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SalidaDialogData,
    private matDialogRef: MatDialogRef<SalidaDialogComponent>,
    private usuarioService: UsuarioService,
    private sucursalService: SucursalService,
    private salidaService: SalidaService,
    private notificicacionBar: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private salidaItemService: SalidaItemService,
    private dialogoService: DialogosService,
    private cargandoService: CargandoDialogService
  ) {
    if (data.salida != null) this.selectedSalida = data.salida;
  }

  ngOnInit(): void {
    this.cargandoService.openDialog()
    //inicializar arrays
    this.usuarioList = [];
    this.tipoSalidasList = [];
    this.sucursalList = [];
    this.itemDataSource.data = []

    this.createForm();
    this.buscarSucursales();

    //listeners de los controls
    this.usuarioInputControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      if (res != null && res.length != 0) {
        this.timer = setTimeout(() => {
          this.usuarioService.onSeachUsuario(res).pipe(untilDestroyed(this)).subscribe((response) => {
            this.usuarioList = response["data"];
            if (this.usuarioList.length == 1) {
              this.onResponsableSelect(this.usuarioList[0]);
              this.onResponsableAutocompleteClose();
            } else {
              this.onResponsableAutocompleteClose();
              this.onResponsableSelect(null);
            }
          })
        }, 500);
      } else {
        this.usuarioList = [];
      }
    });

    if (this.data?.salida != null) this.cargarDatos();
    if (this.data?.id!=null) this.buscarSalida(this.data.id)

    this.cargandoService.closeDialog()

  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("responsableCarga", this.responsableCargaControl);
    this.formGroup.addControl("tipoSalida", this.tipoSalidaControl);
    this.formGroup.addControl("sucursal", this.sucursalControl);
    this.formGroup.addControl("observacion", this.observacionControl);
    this.formGroup.addControl("observacion", this.observacionControl);
    this.formGroup.addControl("usuarioInput", this.usuarioInputControl);
    this.formGroup.addControl("id", this.idControl);
    this.formGroup.addControl("creadoEn", this.creadoEnControl);
    this.formGroup.controls.id.disable();
    this.formGroup.controls.creadoEn.disable();

    this.itemFormGroup = new FormGroup({});
    this.itemFormGroup.addControl("producto", this.productoControl);
    this.itemFormGroup.addControl("presentacion", this.presentacionControl);
    this.itemFormGroup.addControl("cantidad", this.cantidadControl);
    this.itemFormGroup.addControl("observacion", this.itemObservacionControl);
    this.itemFormGroup.addControl("productoId", this.productoIdControl);
    this.presentacionControl.disable();
    this.productoIdControl.disable();
    this.tipoSalidasList = Object.values(TipoSalida);
    this.onSelectTipoSalida(TipoSalida.SUCURSAL);
  }

  buscarSucursales() {
    this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this)).subscribe((res) => {
      this.sucursalList = res.sort((a, b) => {
        if (a.nombre < b.nombre) {
          return -1;
        } else {
          return 1;
        }
      });
    });
  }

  buscarSalida(id){
    this.salidaService.onGetSalida(id).pipe(untilDestroyed(this)).subscribe(res => {
      console.log(res)
      if(res!=null){
        this.selectedSalida = res;
        this.cargarDatos()
      } 
    })
  }

  cargarDatos() {
    this.isEditar = false;
    this.idControl.setValue(this.selectedSalida.id);
    this.creadoEnControl.setValue(this.selectedSalida.creadoEn);
    this.onResponsableSelect(this.selectedSalida?.responsableCarga);
    this.onSelectTipoSalida(this.selectedSalida?.tipoSalida);
    this.onSelectSucursal(this.selectedSalida?.sucursal);
    this.formGroup.disable();
    if(this.selectedSalida.salidaItemList!=null){
      this.itemDataSource.data = this.selectedSalida.salidaItemList;
    }
    setTimeout(() => {
      this.setFocusToProductoInput();
    }, 100);
  }

  onSelectSucursal(e) {
    console.log(e);
    this.selectedSucursal = this.sucursalList.find((s) => s.id == e);
    if (this.selectedSucursal != null) {
      this.sucursalControl.setValue(this.selectedSucursal.id);
    }
  }

  onUsuarioInput() {}

  onResponsableSelect(e) {
    console.log(e);
    if (e?.id != null) {
      this.selectedResponsable = e;
      this.usuarioInputControl.setValue(
        this.selectedResponsable?.id +
          " - " +
          this.selectedResponsable?.persona?.nombre
      );
    }
  }

  onResponsableAutocompleteClose() {
    setTimeout(() => {
      this.responsableInput.nativeElement.select();
    }, 0);
  }

  onSelectTipoSalida(e) {
    console.log(e);
    this.selectedTipoSalida = e as TipoSalida;
    this.tipoSalidaControl.setValue(this.selectedTipoSalida);
    if (this.selectedTipoSalida != TipoSalida.SUCURSAL) {
      this.onSelectSucursal(null);
    }
  }

  setFocusToTipoSalida() {
    setTimeout(() => {
      this.tipoSalidaSelect._elementRef.nativeElement.focus();
    }, 0);
  }

  onEdit(e: SalidaItem) {}

  onDelete() {
    this.cargandoService.openDialog()

    this.dialogoService.confirm('Atención!!', 'Realmente desea eliminar este item?', null, [`Producto: ${this.selectedSalidaItem.producto.descripcion.toUpperCase()}`, `Presentación: ${this.selectedSalidaItem.presentacion.descripcion.toUpperCase()}`, `Cantidad: ${this.selectedSalidaItem.cantidad}`]).subscribe(res => {
      if(res){
        this.salidaItemService.onDeleteSalidaItem(this.selectedSalidaItem.id).pipe(untilDestroyed(this)).subscribe(res2 => {
          if(res2){
            let auxArray = this.itemDataSource.data;
            let index = auxArray.findIndex(i => i.id == this.selectedSalidaItem.id)
            if(index> -1){
              auxArray.splice(index, 1);
              this.itemDataSource.data = auxArray;
            }
            this.onEditItem()
          }
          this.cargandoService.closeDialog()

        })
      }
    })
  }

  onSaveSalida() {
    this.cargandoService.openDialog()

    console.log(this.selectedSalida);
    console.log(this.selectedResponsable);
    console.log(this.selectedSucursal);
    console.log(this.selectedTipoSalida);
    let salida = new SalidaInput();
    salida.id = this.selectedSalida?.id;
    salida.responsableCargaId = this.selectedResponsable?.id;
    salida.tipoSalida = this.selectedTipoSalida;
    salida.sucursalId = this.selectedSucursal?.id;
    salida.creadoEn = this.selectedSalida?.creadoEn;
    salida.activo = this.selectedSalida?.activo;
    console.log(salida);
    this.salidaService.onSaveSalida(salida).pipe(untilDestroyed(this)).subscribe((res) => {
      console.log(res);
      this.selectedSalida = res["data"] as Salida;
      console.log(this.selectedSalida);
      this.isEditar = false;
      this.cargarDatos();
      this.usuarioInputControl.disable();
      this.tipoSalidaControl.disable();
      this.sucursalControl.disable();
      this.cargandoService.closeDialog()

    });
  }

  addProducto() {}

  onEditar() {
    this.isEditar = true;
    this.usuarioInputControl.enable();
    this.tipoSalidaControl.enable();
    this.sucursalControl.enable();
  }

  onCancelar() {
    console.log("hola");
    this.selectedSalida.salidaItemList = this.itemDataSource.data;
    this.matDialogRef.close(this.selectedSalida);
  }

  searchProducto() {
    let texto: string = this.productoControl.value;
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: {
          texto: texto != null ? texto.toUpperCase() : "",
          mostrarStock: true
        },
        width: "100%",
        height: "100%",
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        let respuesta: PdvSearchProductoResponseData;
        if (res != null) {
          respuesta = res;
          this.onSelectProducto(respuesta.producto);
          this.onSelectPresentacion(respuesta.presentacion);
          this.cargandoService.closeDialog()
          this.onFocusToCantidad()
        }
      });
  }

  onSelectProducto(producto) {
    this.selectedProducto = producto;
    this.productoControl.setValue(this.selectedProducto.descripcion);
    this.productoIdControl.setValue(this.selectedProducto.id);
  }

  onProductoFocus(){
    this.productoControl.value != null ? this.productoInput.nativeElement.select() : null;
  }

  onSelectPresentacion(presentacion) {
    this.selectedPresentacion = presentacion;
    this.presentacionControl.setValue(this.selectedPresentacion.descripcion);
  }

  setFocusToProductoInput() {
    setTimeout(() => {
      this.productoInput.nativeElement.focus();
    }, 200);
  }

  onFocusToCantidad() {
    setTimeout(() => {
      this.cantidadInput.nativeElement.focus();
    }, 100);
  }

  onItemSave(){
    this.cargandoService.openDialog()

    if(this.itemFormGroup.valid){
      let isNew = this.selectedSalidaItem?.id == null;
      let item = new SalidaItem();
      let auxArray: SalidaItem[] = []
      item.id = this.selectedSalidaItem?.id;
      item.salida = this.selectedSalida;
      item.producto = this.selectedProducto;
      item.presentacion = this.selectedPresentacion;
      item.cantidad = this.cantidadControl.value;
      item.usuario = this.selectedSalidaItem?.usuario;
      item.creadoEn = this.selectedSalidaItem?.creadoEn;
      console.log(item.cantidad * item.presentacion.cantidad > item?.producto?.stockPorProducto)
      if((item.cantidad * item.presentacion.cantidad) > item?.producto?.stockPorProducto){
        this.dialogoService.confirm('Atención!!', 'El stock actual del producto es inferior a la intención de salida', 'Desea continuar?', [`Actual: ${item.producto.stockPorProducto}`, `Cantidad a dar salida: ${item.cantidad}`]).subscribe(res => {
          if(res){
            this.salidaItemService.onSaveSalidaItem(item.toInput()).pipe(untilDestroyed(this)).subscribe(res => {
              if(res!=null){
                this.selectedSalidaItem = res;
                if(!isNew){
                  let index = this.itemDataSource.data.findIndex(s => s.id == this.selectedSalidaItem.id)
                  auxArray = this.itemDataSource.data;
                  auxArray[index] = this.selectedSalidaItem;
                  this.itemDataSource.data = auxArray;
                } else {
                  auxArray = this.itemDataSource.data;
                  auxArray.push(this.selectedSalidaItem)
                  this.itemDataSource.data = auxArray;
                }
              }
              this.itemFormGroup.reset()
              this.onEditItem()
            });
          }
        })
      } else {
        this.salidaItemService.onSaveSalidaItem(item.toInput()).pipe(untilDestroyed(this)).subscribe(res => {
          if(res!=null){
            this.selectedSalidaItem = res;
            if(!isNew){
              let index = this.itemDataSource.data.findIndex(s => s.id == this.selectedSalidaItem.id)
              auxArray = this.itemDataSource.data;
              auxArray[index] = this.selectedSalidaItem;
              this.itemDataSource.data = auxArray;
            } else {
              auxArray = this.itemDataSource.data;
              auxArray.push(this.selectedSalidaItem)
              this.itemDataSource.data = auxArray;
            }
          }
          this.itemFormGroup.reset()
          this.onEditItem()
          this.cargandoService.closeDialog()

        });
      }
      
    }
  }

  onSelectSalidaItem(item: SalidaItem){
    this.selectedSalidaItem = item;
    this.onSelectProducto(item.producto);
    this.onSelectPresentacion(item.presentacion);
    this.cantidadControl.setValue(item.cantidad)
    this.itemFormGroup.disable()
    this.isItemEditar = false;
  }

  onEditItem(){
    console.log('hola')
    this.isItemEditar = true;
    this.productoControl.enable()
    this.cantidadControl.enable()
    this.setFocusToProductoInput()
  }

  onFinalizarSalida(){
    this.cargandoService.openDialog()

    if(this.selectedSalida?.id != null){
      this.salidaService.onFinalizarEntrega(this.selectedSalida.id).pipe(untilDestroyed(this)).subscribe(res => {
        this.selectedSalida.activo = res as boolean;
        this.cargandoService.closeDialog()
      })
    }
  }
}
