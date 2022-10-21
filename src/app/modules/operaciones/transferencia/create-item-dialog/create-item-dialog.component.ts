import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Presentacion } from './../../../productos/presentacion/presentacion.model';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { EtapaTransferencia, Transferencia, TransferenciaEstado, TransferenciaItem } from '../transferencia.model';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { PresentacionService } from '../../../productos/presentacion/presentacion.service';

export interface CreateItemDialogData {
  item: TransferenciaItem;
  presentacion: Presentacion;
  transferencia?: Transferencia;
  cantidad?: number;
}


@UntilDestroy()
@Component({
  selector: 'app-create-item-dialog',
  templateUrl: './create-item-dialog.component.html',
  styleUrls: ['./create-item-dialog.component.scss']
})
export class CreateItemDialogComponent implements OnInit {

  @ViewChild('cantidadInput', { static: true }) cantidadInput: ElementRef;

  selectedItem = new TransferenciaItem;
  selectedtransferencia: Transferencia;
  activoControl = new FormControl(true, Validators.required)
  cantidadControl = new FormControl(1, [Validators.required, Validators.min(0)])
  vencimientoControl = new FormControl()
  formGroup = new FormGroup({
    'activo': this.activoControl,
    // 'poseeVencimiento': this.poseeVencimientoControl,
    'cantidad': this.cantidadControl,
    'vencimiento': this.vencimientoControl
  })

  selectedPresentacion: Presentacion;
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: CreateItemDialogData,
    private matDialogRef: MatDialogRef<CreateItemDialogComponent>,
    private presentacionService: PresentacionService,
    private cargandoService: CargandoDialogService
  ) { }

  ngOnInit(): void {
    this.cargandoService.openDialog()
    this.selectedtransferencia = this.data.transferencia;
    if (this.data.item != null) {
      this.cargarDatos(this.data.item)
    } else if (this.data.presentacion != null) {
      this.presentacionService.onGetPresentacion(this.data.presentacion?.id)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.cargandoService.closeDialog()
          if (res != null) {
            this.selectedPresentacion = res as Presentacion;
            console.log(this.selectedPresentacion);
            
          }
        })
    } else {
      this.matDialogRef.close()
    }

    if(this.data?.cantidad != null){
      this.cantidadControl.setValue(this.data.cantidad)
    }

    // this.poseeVencimientoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
    //   if (res) {
    //     this.vencimientoControl.enable()
    //   } else {
    //     this.vencimientoControl.setValue(null)
    //     this.vencimientoControl.disable()
    //   }
    // })

    setTimeout(() => {
      this.cantidadInput.nativeElement.select()
      console.log(this.cantidadInput)
    }, 500);
  }

  cargarDatos(item: TransferenciaItem) {
    this.selectedItem = item;
    if (this.selectedtransferencia.etapa == EtapaTransferencia.PRE_TRANSFERENCIA_CREACION || this.selectedtransferencia.etapa == EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN) {
      this.activoControl.setValue(item.activo)
      this.cantidadControl.setValue(item.cantidadPreTransferencia)
      this.vencimientoControl.setValue(new Date(item.vencimientoPreTransferencia))
      this.selectedPresentacion = item.presentacionPreTransferencia;
      this.cargandoService.closeDialog()
    }
  }

  onCancelar() {
    this.matDialogRef.close()
  }
  onGuardar() {
    if (this.selectedtransferencia.etapa == EtapaTransferencia.PRE_TRANSFERENCIA_CREACION || this.selectedtransferencia.etapa == EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN) {
      this.selectedItem.presentacionPreTransferencia = this.selectedPresentacion;
      this.selectedItem.activo = this.activoControl.value;
      this.selectedItem.cantidadPreTransferencia = this.cantidadControl.value;
      this.selectedItem.poseeVencimiento = this.selectedPresentacion?.producto?.vencimiento == true;
      if (this.selectedItem.poseeVencimiento) {
        this.selectedItem.vencimientoPreTransferencia = this.vencimientoControl.value;
      }
      this.matDialogRef.close({ item: this.selectedItem })
    }
  }

}
