import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { Presentacion } from '../../presentacion/presentacion.model';
import { TipoPrecio } from '../../tipo-precio/tipo-precio.model';
import { TipoPrecioService } from '../../tipo-precio/tipo-precio.service';
import { PrecioPorSucursalInput } from '../precio-por-sucursal-input.model';
import { PrecioPorSucursal } from '../precio-por-sucursal.model';
import { PrecioPorSucursalService } from '../precio-por-sucursal.service';

export class AdicionarPrecioPorSucursalData {
  precio: PrecioPorSucursal;
  presentacion: Presentacion;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-precio-dialog',
  templateUrl: './adicionar-precio-dialog.component.html',
  styleUrls: ['./adicionar-precio-dialog.component.scss']
})
export class AdicionarPrecioDialogComponent implements OnInit {
  formGroup: FormGroup;
  selectedPrecioPorSucursal: PrecioPorSucursal;
  precioControl = new FormControl(null, Validators.required);
  principalControl = new FormControl(null);
  tipoPrecioControl = new FormControl(null);
  activoControl = new FormControl(null);
  precioInput = new PrecioPorSucursalInput;
  isEditting = false;
  tipoPrecioList: TipoPrecio[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarPrecioPorSucursalData,
    private matDialogRef: MatDialogRef<AdicionarPrecioDialogComponent>,
    private precioService: PrecioPorSucursalService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private tipoPrecioService: TipoPrecioService,
    private cargandoDialog: CargandoDialogService
  ) {}

  ngOnInit(): void {
    this.createForm();

    //inicializando arrays
    this.tipoPrecioList = []

    this.loadTipoPrecios()

    if (this.data?.precio?.id != null) {
      this.cargarDato();
      this.formGroup.disable()
    } else {
      this.isEditting = true;
    }
  }

  loadTipoPrecios(){
    this.tipoPrecioService.onGetAllTipoPrecios().pipe(untilDestroyed(this)).subscribe(res => {
      if(res.errors==null){
        this.tipoPrecioList = res.data.data;
      }
    })
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("precio", this.precioControl);
    this.formGroup.addControl("principal", this.principalControl);
    this.formGroup.addControl("activo", this.activoControl);
    this.formGroup.addControl("tipoPrecio", this.tipoPrecioControl);

    //inicializando controles
    this.principalControl.setValue(false);
    this.activoControl.setValue(true);


  }

  cargarDato() {
    this.selectedPrecioPorSucursal = this.data.precio;
    this.precioControl.setValue(this.selectedPrecioPorSucursal.precio);
    this.principalControl.setValue(this.selectedPrecioPorSucursal.principal);
    this.activoControl.setValue(this.selectedPrecioPorSucursal.activo);
    this.tipoPrecioControl.setValue(this.selectedPrecioPorSucursal.tipoPrecio.id);

    //cargar input
    this.precioInput.id = this.selectedPrecioPorSucursal.id;

    console.log(this.tipoPrecioControl.value)
  }

  onSave() {
    this.cargandoDialog.openDialog()
    this.precioInput.precio = this.precioControl.value;
    this.precioInput.activo = this.activoControl.value;
    this.precioInput.principal = this.principalControl.value;
    this.precioInput.presentacionId = this.data.presentacion.id;
    this.precioInput.tipoPrecioId = this.tipoPrecioControl.value;
    //primero buscar si ya existe el codigo a guardar
    this.precioService.onSave(this.precioInput).pipe(untilDestroyed(this)).subscribe(res => {
      this.cargandoDialog.closeDialog()
      if(res!=null){
        this.matDialogRef.close(res)
      }
    })    
  }

  onCancelar() {
    this.matDialogRef.close()
  }

}
