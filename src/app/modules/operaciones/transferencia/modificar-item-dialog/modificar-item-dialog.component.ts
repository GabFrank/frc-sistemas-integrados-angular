import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TransferenciaItem, TransferenciaItemMotivoModificacion, TransferenciaItemMotivoRechazo, EtapaTransferencia } from './../transferencia.model';
import { Validators } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { Presentacion } from './../../../productos/presentacion/presentacion.model';
import { Component, Inject, OnInit } from '@angular/core';

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
    switch (this.data.etapa) {
      case EtapaTransferencia.PREPARACION_MERCADERIA:
        if (this.data.isCantidad) {
          this.selectedItem.cantidadPreparacion = this.cantidadControl.value;
          this.selectedItem.motivoModificacionPreparacion = TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
          this.selectedItem.presentacionPreparacion = this.selectedItem.presentacionPreTransferencia;
          this.selectedItem.vencimientoPreparacion = this.selectedItem.vencimientoPreTransferencia;
        }
        if (this.data.isVencimiento) {
          this.selectedItem.cantidadPreparacion = this.selectedItem.cantidadPreTransferencia;
          this.selectedItem.presentacionPreparacion = this.selectedItem.presentacionPreTransferencia;
          this.selectedItem.vencimientoPreparacion = this.vencimientoControl.value;
          this.selectedItem.motivoModificacionPreparacion = TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
        }
        if (this.data.isRechazar) {
          this.selectedItem.cantidadPreparacion = null;
          this.selectedItem.motivoModificacionPreparacion = null
          this.selectedItem.vencimientoPreparacion = null
          this.selectedItem.motivoRechazoPreparacion = this.motivoControl.value;
        }
        break;
      case EtapaTransferencia.TRANSPORTE_VERIFICACION:
        if (this.data.isCantidad) {
          this.selectedItem.cantidadTransporte = this.cantidadControl.value;
          this.selectedItem.motivoModificacionTransporte = TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
          this.selectedItem.presentacionTransporte = this.selectedItem.presentacionPreparacion;
          this.selectedItem.vencimientoTransporte = this.selectedItem.vencimientoPreparacion;
        }
        if (this.data.isVencimiento) {
          this.selectedItem.cantidadTransporte = this.selectedItem.cantidadPreparacion;
          this.selectedItem.presentacionTransporte = this.selectedItem.presentacionPreparacion;
          this.selectedItem.vencimientoTransporte = this.vencimientoControl.value;
          this.selectedItem.motivoModificacionTransporte = TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
        }
        if (this.data.isRechazar) {
          this.selectedItem.cantidadTransporte = null;
          this.selectedItem.motivoModificacionTransporte = null
          this.selectedItem.vencimientoTransporte = null
          this.selectedItem.motivoRechazoTransporte = this.motivoControl.value;
        }
        break;
      case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
        if (this.data.isCantidad) {
          this.selectedItem.cantidadRecepcion = this.cantidadControl.value;
          this.selectedItem.motivoModificacionRecepcion = TransferenciaItemMotivoModificacion.CANTIDAD_INCORRECTA
          this.selectedItem.presentacionRecepcion = this.selectedItem.presentacionTransporte;
          this.selectedItem.vencimientoRecepcion = this.selectedItem.vencimientoTransporte;
        }
        if (this.data.isVencimiento) {
          this.selectedItem.cantidadRecepcion = this.selectedItem.cantidadTransporte;
          this.selectedItem.presentacionRecepcion = this.selectedItem.presentacionTransporte;
          this.selectedItem.vencimientoRecepcion = this.vencimientoControl.value;
          this.selectedItem.motivoModificacionRecepcion = TransferenciaItemMotivoModificacion.VENCIMIENTO_INCORRECTO
        }
        if (this.data.isRechazar) {
          this.selectedItem.cantidadRecepcion = null;
          this.selectedItem.motivoModificacionRecepcion = null
          this.selectedItem.vencimientoRecepcion = null
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
