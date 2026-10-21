import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TransferenciaItem, TransferenciaItemMotivoModificacion, TransferenciaItemMotivoRechazo, EtapaTransferencia } from './../transferencia.model';
import { Validators } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { Presentacion } from './../../../productos/presentacion/presentacion.model';
import { Component, Inject, OnInit } from '@angular/core';
import { aplicarConfirmacion } from '../transferencia-item-confirmacion';

export interface ModificarItemDialoData {
  item: TransferenciaItem
  isCantidad?: boolean
  isVencimiento?: boolean
  isRechazar?: boolean
  etapa?: EtapaTransferencia
}

@Component({
  selector: 'app-modificar-item-dialog',
  templateUrl: './modificar-item-dialog.component.html',
  styleUrls: ['./modificar-item-dialog.component.scss']
})
export class ModificarItemDialogComponent implements OnInit {

  selectedItem: TransferenciaItem;
  selectedCantidadAnterior: number;
  selectedVencimientoAnterior: Date;
  selectedPresentacion: Presentacion
  cantidadControl = new FormControl(null, Validators.required)
  motivoList: string[];
  motivoControl = new FormControl(null, Validators.required)
  vencimientoControl = new FormControl(null, Validators.required)

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ModificarItemDialoData,
    private matDialogRef: MatDialogRef<ModificarItemDialogComponent>
  ) { }

  ngOnInit(): void {
    this.motivoList = Object.values(TransferenciaItemMotivoRechazo);
    this.selectedItem = new TransferenciaItem;
    Object.assign(this.selectedItem, this.data?.item)
    switch (this.data.etapa) {
      case EtapaTransferencia.PREPARACION_MERCADERIA:
        this.selectedPresentacion = this.selectedItem.presentacionPreTransferencia;
        if (this.data.isCantidad) {
          this.selectedCantidadAnterior = this.selectedItem?.cantidadPreTransferencia;
        } else if (this.data.isVencimiento) {
          this.selectedVencimientoAnterior = this.selectedItem?.vencimientoPreTransferencia;
        }
        break;
      case EtapaTransferencia.TRANSPORTE_VERIFICACION:
        this.selectedPresentacion = this.selectedItem.presentacionTransporte;
        if (this.data.isCantidad) {
          this.selectedCantidadAnterior = this.selectedItem?.cantidadTransporte;
        } else if (this.data.isVencimiento) {
          this.selectedVencimientoAnterior = this.selectedItem?.vencimientoTransporte;
        }
        break;
      case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
        this.selectedPresentacion = this.selectedItem.presentacionRecepcion;
        if (this.data.isCantidad) {
          this.selectedCantidadAnterior = this.selectedItem?.cantidadRecepcion;
        } else if (this.data.isVencimiento) {
          this.selectedVencimientoAnterior = this.selectedItem?.vencimientoRecepcion;
        }
        break;

      default:
        break;
    }
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

  onSelectMotivo(motivo: string) {
    console.log(this.motivoControl.value)
  }

}
