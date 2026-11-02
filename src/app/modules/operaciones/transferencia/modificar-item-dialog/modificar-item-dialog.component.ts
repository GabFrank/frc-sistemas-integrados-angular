import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TransferenciaItem, TransferenciaItemMotivoModificacion, TransferenciaItemMotivoRechazo, EtapaTransferencia } from './../transferencia.model';
import { Validators } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { Component, Inject, OnInit } from '@angular/core';
import { aplicarConfirmacion, datosDeOrigen, DatosDeEtapa } from '../transferencia-item-confirmacion';

export interface ModificarItemDialoData {
  item: TransferenciaItem
  isCantidad?: boolean
  isVencimiento?: boolean
  isRechazar?: boolean
  etapa?: EtapaTransferencia
}

const MOTIVOS_RECHAZO: { value: TransferenciaItemMotivoRechazo; label: string }[] = [
  { value: TransferenciaItemMotivoRechazo.FALTA_PRODUCTO, label: 'Falta producto' },
  { value: TransferenciaItemMotivoRechazo.PRODUCTO_AVERIADO, label: 'Producto averiado' },
  { value: TransferenciaItemMotivoRechazo.PRODUCTO_VENCIDO, label: 'Producto vencido' },
  { value: TransferenciaItemMotivoRechazo.PRODUCTO_EQUIVOCADO, label: 'Producto equivocado' },
];

@Component({
  selector: 'app-modificar-item-dialog',
  templateUrl: './modificar-item-dialog.component.html',
  styleUrls: ['../ruta-hoja/ruta-hoja.component.scss', './modificar-item-dialog.component.scss']
})
export class ModificarItemDialogComponent implements OnInit {

  selectedItem: TransferenciaItem;
  cantidadControl = new FormControl(null, Validators.required)
  motivoList = MOTIVOS_RECHAZO;
  motivoControl = new FormControl(null, Validators.required)
  vencimientoControl = new FormControl(null, Validators.required)

  // Lo que muestra el template, calculado una vez (nada de funciones en el HTML).
  controlActivo: FormControl;
  titulo: string;
  icono: string;
  productoDescripcion: string;
  productoCodigo: string;
  /** Datos de la etapa de la que copia esta: los mismos que guarda aplicarConfirmacion. */
  origen: DatosDeEtapa;
  totalUnidades: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ModificarItemDialoData,
    private matDialogRef: MatDialogRef<ModificarItemDialogComponent>
  ) { }

  ngOnInit(): void {
    this.selectedItem = new TransferenciaItem;
    Object.assign(this.selectedItem, this.data?.item)

    if (this.data?.isCantidad) {
      this.controlActivo = this.cantidadControl;
      this.titulo = 'Modificar cantidad';
      this.icono = 'edit';
    } else if (this.data?.isVencimiento) {
      this.controlActivo = this.vencimientoControl;
      this.titulo = 'Modificar vencimiento';
      this.icono = 'event';
    } else {
      this.controlActivo = this.motivoControl;
      this.titulo = 'Rechazar ítem';
      this.icono = 'block';
    }

    // Tras desconfirmar, la fila puede venir sin producto en las presentaciones de etapa:
    // el producto se lee de la de pre-transferencia, que la grilla siempre trae.
    const producto = this.selectedItem.presentacionPreTransferencia?.producto;
    this.productoDescripcion = producto?.descripcion ?? '';
    this.productoCodigo = producto?.codigoPrincipal ?? '';
    this.origen = datosDeOrigen(this.selectedItem, this.data?.etapa);
    this.totalUnidades =
      this.origen?.cantidad != null && this.origen?.presentacion?.cantidad != null
        ? this.origen.cantidad * this.origen.presentacion.cantidad
        : null;
  }

  /** Enter en un input: confirma solo si el campo es válido, igual que el botón. */
  onEnter() {
    if (this.controlActivo.invalid) return;
    this.onAceptar();
  }

  onCancelar() {
    this.matDialogRef.close()
  }

  onAceptar() {
    // El ítem se desconfirma antes de guardar si ya estaba cargado (#569), y el save es un PATCH: un
    // null no borra nada. Modificar limpia el rechazo de la copia (si no, lo reescribe) y rechazar
    // lleva la cantidad y la presentación de la etapa anterior, como el avance de etapa y la PWA: el
    // central arma el movimiento de stock con cantidad * presentación y con null falla.
    switch (this.data.etapa) {
      case EtapaTransferencia.PREPARACION_MERCADERIA:
        if (this.data.isCantidad) {
          this.selectedItem.cantidadPreparacion = this.cantidadControl.value;
          this.selectedItem.motivoModificacionPreparacion = TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
          this.selectedItem.motivoRechazoPreparacion = null;
          this.selectedItem.presentacionPreparacion = this.selectedItem.presentacionPreTransferencia;
          this.selectedItem.vencimientoPreparacion = this.selectedItem.vencimientoPreTransferencia;
        }
        if (this.data.isVencimiento) {
          this.selectedItem.cantidadPreparacion = this.selectedItem.cantidadPreTransferencia;
          this.selectedItem.presentacionPreparacion = this.selectedItem.presentacionPreTransferencia;
          this.selectedItem.vencimientoPreparacion = this.vencimientoControl.value;
          this.selectedItem.motivoModificacionPreparacion = TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
          this.selectedItem.motivoRechazoPreparacion = null;
        }
        if (this.data.isRechazar) {
          aplicarConfirmacion(this.selectedItem, this.data.etapa);
          this.selectedItem.motivoModificacionPreparacion = null
          this.selectedItem.motivoRechazoPreparacion = this.motivoControl.value;
        }
        break;
      case EtapaTransferencia.TRANSPORTE_VERIFICACION:
        if (this.data.isCantidad) {
          this.selectedItem.cantidadTransporte = this.cantidadControl.value;
          this.selectedItem.motivoModificacionTransporte = TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
          this.selectedItem.motivoRechazoTransporte = null;
          this.selectedItem.presentacionTransporte = this.selectedItem.presentacionPreparacion;
          this.selectedItem.vencimientoTransporte = this.selectedItem.vencimientoPreparacion;
        }
        if (this.data.isVencimiento) {
          this.selectedItem.cantidadTransporte = this.selectedItem.cantidadPreparacion;
          this.selectedItem.presentacionTransporte = this.selectedItem.presentacionPreparacion;
          this.selectedItem.vencimientoTransporte = this.vencimientoControl.value;
          this.selectedItem.motivoModificacionTransporte = TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
          this.selectedItem.motivoRechazoTransporte = null;
        }
        if (this.data.isRechazar) {
          aplicarConfirmacion(this.selectedItem, this.data.etapa);
          this.selectedItem.motivoModificacionTransporte = null
          this.selectedItem.motivoRechazoTransporte = this.motivoControl.value;
        }
        break;
      case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
        if (this.data.isCantidad) {
          this.selectedItem.cantidadRecepcion = this.cantidadControl.value;
          this.selectedItem.motivoModificacionRecepcion = TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
          this.selectedItem.motivoRechazoRecepcion = null;
          this.selectedItem.presentacionRecepcion = this.selectedItem.presentacionTransporte;
          this.selectedItem.vencimientoRecepcion = this.selectedItem.vencimientoTransporte;
        }
        if (this.data.isVencimiento) {
          this.selectedItem.cantidadRecepcion = this.selectedItem.cantidadTransporte;
          this.selectedItem.presentacionRecepcion = this.selectedItem.presentacionTransporte;
          this.selectedItem.vencimientoRecepcion = this.vencimientoControl.value;
          this.selectedItem.motivoModificacionRecepcion = TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
          this.selectedItem.motivoRechazoRecepcion = null;
        }
        if (this.data.isRechazar) {
          aplicarConfirmacion(this.selectedItem, this.data.etapa);
          this.selectedItem.motivoModificacionRecepcion = null
          this.selectedItem.motivoRechazoRecepcion = this.motivoControl.value;
        }
        break;
      default:
        break;
    }

    this.matDialogRef.close({ item: this.selectedItem })
  }

}
