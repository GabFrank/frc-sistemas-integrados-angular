import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { finalize } from 'rxjs/operators';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { avisoTrasMutacion, erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Usuario } from '../../../personas/usuarios/usuario.model';
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
  usuarioInputControl = new FormControl<Usuario>(null);
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
    "cantidad"];

  isEditar = true;
  isItemEditar = true;
  /** Su finalización quedó sin respuesta en esta sesión: no se toca hasta releerla finalizada (#527). */
  bloqueada = false;
  finalizando = false;

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
    const { requestId } = this.cargandoService.openDialog()
    //inicializar arrays
    this.tipoSalidasList = [];
    this.sucursalList = [];
    this.itemDataSource.data = []

    this.createForm();
    this.buscarSucursales();

    //listeners de los controls

    if (this.data?.salida != null) this.cargarDatos();
    // La fila de la lista puede ser de antes de un corte: se relee (#527)
    if (this.data?.salida?.id != null) this.buscarSalida(this.data.salida.id)
    if (this.data?.id != null) this.buscarSalida(this.data.id)

    this.cargandoService.closeDialog(requestId)

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
    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe((res) => {
      this.sucursalList = res;
    });
  }

  buscarSalida(id) {
    // Tapa la pantalla hasta que llega: una relectura tardía pisaría lo que el usuario hizo mientras tanto (#527)
    const { requestId } = this.cargandoService.openDialog()
    this.salidaService.onGetSalida(id).pipe(untilDestroyed(this), finalize(() => this.cargandoService.closeDialog(requestId))).subscribe(res => {
      if (res != null) {
        this.selectedSalida = res;
        this.cargarDatos()
      }
    })
  }

  cargarDatos() {
    this.actualizarBloqueo();
    this.isEditar = false;
    this.idControl.setValue(this.selectedSalida.id);
    this.creadoEnControl.setValue(this.selectedSalida.creadoEn);
    this.usuarioInputControl.setValue(this.selectedSalida?.responsableCarga ?? null);
    this.onResponsableSelect(this.selectedSalida?.responsableCarga);
    this.onSelectTipoSalida(this.selectedSalida?.tipoSalida);
    this.onSelectSucursal(this.selectedSalida?.sucursal);
    this.formGroup.disable();
    if (this.selectedSalida.salidaItemList != null) {
      this.itemDataSource.data = this.selectedSalida.salidaItemList;
    }
    setTimeout(() => {
      this.setFocusToProductoInput();
    }, 100);
  }

  onSelectSucursal(e) {
    this.selectedSucursal = this.sucursalList.find((s) => s.id == e);
    if (this.selectedSucursal != null) {
      this.sucursalControl.setValue(this.selectedSucursal.id);
    }
  }

  onResponsableSelect(e: Usuario) {
    this.selectedResponsable = e?.id != null ? e : null;
  }

  onSelectTipoSalida(e) {
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

  onEdit(e: SalidaItem) { }

  onDelete() {
    if (this.bloqueada) return;
    this.dialogoService.confirm('Atención!!', 'Realmente desea eliminar este item?', null, [`Producto: ${this.selectedSalidaItem.producto.descripcion.toUpperCase()}`, `Presentación: ${this.selectedSalidaItem.presentacion.descripcion.toUpperCase()}`, `Cantidad: ${this.selectedSalidaItem.cantidad}`]).subscribe(res => {
      if (res) {
        this.salidaItemService.onDeleteSalidaItem(this.selectedSalidaItem.id).pipe(untilDestroyed(this))
          .subscribe(res2 => {
            if (res2) {
              let auxArray = this.itemDataSource.data;
              let index = auxArray.findIndex(i => i.id == this.selectedSalidaItem.id)
              if (index > -1) {
                auxArray.splice(index, 1);
                this.itemDataSource.data = auxArray;
              }
              this.onEditItem()
            }
          })
      }
    })
  }

  onSaveSalida() {
    if (this.bloqueada) return;
    let salida = new SalidaInput();
    salida.id = this.selectedSalida?.id;
    salida.responsableCargaId = this.selectedResponsable?.id;
    salida.tipoSalida = this.selectedTipoSalida;
    salida.sucursalId = this.selectedSucursal?.id;
    salida.creadoEn = this.selectedSalida?.creadoEn;
    salida.activo = this.selectedSalida?.activo;
    const esAlta = salida.id == null;
    this.salidaService.onSaveSalida(salida).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.selectedSalida = res;
        this.isEditar = false;
        this.cargarDatos();
        this.usuarioInputControl.disable();
        this.tipoSalidaControl.disable();
        this.sucursalControl.disable();
      },
      // Un rechazo ya lo avisó el genérico: se sigue editando. Un alta sin respuesta pudo haberse creado:
      // repetirla crearía otra
      error: (err) => {
        if (esAlta && erroresDeRechazo(err) == null) this.cerrarTrasCorte(err, 'se guardó la salida');
      },
    });
  }

  addProducto() { }

  onEditar() {
    this.isEditar = true;
    this.usuarioInputControl.enable();
    this.tipoSalidaControl.enable();
    this.sucursalControl.enable();
  }

  onCancelar() {
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
          this.onFocusToCantidad()
        }
      });
  }

  onSelectProducto(producto) {
    this.selectedProducto = producto;
    this.productoControl.setValue(this.selectedProducto.descripcion);
    this.productoIdControl.setValue(this.selectedProducto.id);
  }

  onProductoFocus() {
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

  onItemSave() {
    if (this.bloqueada || !this.itemFormGroup.valid) return;
    let isNew = this.selectedSalidaItem?.id == null;
    let item = new SalidaItem();
    item.id = this.selectedSalidaItem?.id;
    item.salida = this.selectedSalida;
    item.producto = this.selectedProducto;
    item.presentacion = this.selectedPresentacion;
    item.cantidad = this.cantidadControl.value;
    item.usuario = this.selectedSalidaItem?.usuario;
    item.creadoEn = this.selectedSalidaItem?.creadoEn;
    if ((item.cantidad * item.presentacion.cantidad) > item?.producto?.stockPorProducto) {
      this.dialogoService.confirm('Atención!!', 'El stock actual del producto es inferior a la intención de salida', 'Desea continuar?', [`Actual: ${item.producto.stockPorProducto}`, `Cantidad a dar salida: ${item.cantidad}`]).subscribe(res => {
        if (res) this.guardarItem(item, isNew);
      })
    } else {
      this.guardarItem(item, isNew);
    }
  }

  private guardarItem(item: SalidaItem, isNew: boolean) {
    this.salidaItemService.onSaveSalidaItem(item.toInput()).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (res != null) {
          let auxArray: SalidaItem[] = []
          this.selectedSalidaItem = res;
          if (!isNew) {
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
      },
      // Un ítem nuevo sin respuesta pudo haberse guardado: repetirlo lo duplica, y al finalizar duplica el stock
      error: err => {
        if (isNew && erroresDeRechazo(err) == null) this.cerrarTrasCorte(err, 'se guardó el ítem');
      },
    });
  }

  onSelectSalidaItem(item: SalidaItem) {
    this.selectedSalidaItem = item;
    this.onSelectProducto(item.producto);
    this.onSelectPresentacion(item.presentacion);
    this.cantidadControl.setValue(item.cantidad)
    this.itemFormGroup.disable()
    this.isItemEditar = false;
  }

  onEditItem() {
    this.isItemEditar = true;
    this.productoControl.enable()
    this.cantidadControl.enable()
    this.setFocusToProductoInput()
  }

  onFinalizarSalida() {
    const id = this.selectedSalida?.id;
    if (id == null || this.finalizando || this.bloqueada) return;
    this.finalizando = true;
    this.salidaService.onFinalizarEntrega(id).pipe(untilDestroyed(this)).subscribe({
      next: (ok) => {
        this.finalizando = false;
        this.selectedSalida.activo = ok == true;
        if (ok) {
          this.notificicacionBar.notification$.next({
            texto: 'Salida finalizada',
            color: NotificacionColor.success,
            duracion: 2,
          });
        }
      },
      error: (err) => {
        this.finalizando = false;
        // Un rechazo ya lo avisó el genérico y no se aplicó nada
        if (erroresDeRechazo(err) != null) return;
        // Sin respuesta pudo haberse aplicado, y repetirla duplica el stock: queda bloqueada en esta sesión
        this.salidaService.finalizacionSinConfirmar.add(id);
        this.cerrarTrasCorte(err, 'se finalizó la salida');
      },
    });
  }

  /** Bloquea la salida si su finalización quedó sin respuesta; la libera recién al leerla finalizada. */
  private actualizarBloqueo() {
    const sinConfirmar = this.salidaService.finalizacionSinConfirmar;
    if (this.selectedSalida?.activo == true) sinConfirmar.delete(this.selectedSalida.id);
    const antes = this.bloqueada;
    this.bloqueada = sinConfirmar.has(this.selectedSalida?.id);
    if (this.bloqueada && !antes) {
      this.notificicacionBar.notification$.next({
        texto: 'No se pudo confirmar si se finalizó esta salida: revisá el stock antes de repetir. Para habilitarla, reiniciá el sistema.',
        color: NotificacionColor.warn,
        duracion: 8,
      });
    }
  }

  /**
   * Tras una escritura sin respuesta que no se puede repetir (alta, finalizar): avisa, cierra y la lista recarga.
   * El corte por tiempo ya lo avisó el link.
   */
  private cerrarTrasCorte(err: any, queSeHizo: string) {
    const aviso = avisoTrasMutacion(err, queSeHizo);
    if (aviso != null) {
      this.notificicacionBar.notification$.next({ texto: aviso, color: NotificacionColor.warn, duracion: 8 });
    }
    this.matDialogRef.close({ recargar: true });
  }
}
