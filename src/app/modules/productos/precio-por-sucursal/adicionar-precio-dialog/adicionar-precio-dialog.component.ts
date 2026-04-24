import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { MainService } from '../../../../main.service';
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
  tipoPrecioControl = new FormControl(null, Validators.required);
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
    private cargandoDialog: CargandoDialogService,
    private mainService: MainService
  ) {}

  ngOnInit(): void {
    this.createForm();

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
      if(res!=null){
        this.tipoPrecioList = res;
      }
    })
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("precio", this.precioControl);
    this.formGroup.addControl("principal", this.principalControl);
    this.formGroup.addControl("activo", this.activoControl);
    this.formGroup.addControl("tipoPrecio", this.tipoPrecioControl);

    this.principalControl.setValue(false);
    this.activoControl.setValue(true);
  }

  cargarDato() {
    this.selectedPrecioPorSucursal = this.data.precio;
    this.precioControl.setValue(this.selectedPrecioPorSucursal.precio);
    this.principalControl.setValue(this.selectedPrecioPorSucursal.principal);
    this.activoControl.setValue(this.selectedPrecioPorSucursal.activo);
    
    if (this.selectedPrecioPorSucursal.tipoPrecio && this.selectedPrecioPorSucursal.tipoPrecio.id) {
      this.tipoPrecioControl.setValue(this.selectedPrecioPorSucursal.tipoPrecio.id);
    }

    this.precioInput.id = this.selectedPrecioPorSucursal.id;

    console.log('Tipo precio cargado:', this.tipoPrecioControl.value);
  }

  onSave() {
    if (!this.formGroup.valid) {
      this.notificacionSnackBar.notification$.next({
        texto: "Por favor complete todos los campos obligatorios",
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }

    this.cargandoDialog.openDialog();
    
    this.precioInput.precio = this.precioControl.value;
    this.precioInput.activo = this.activoControl.value;
    this.precioInput.principal = this.principalControl.value;
    this.precioInput.presentacionId = this.data.presentacion.id;
    this.precioInput.tipoPrecioId = this.tipoPrecioControl.value;

    if (this.principalControl.value === true) {
      this.precioService.onGetPrecioPorSurursalPorPresentacionId(this.data.presentacion.id)
        .pipe(untilDestroyed(this))
        .subscribe((preciosExistentes: PrecioPorSucursal[]) => {
          const updatePromises = [];
          
          if (preciosExistentes && preciosExistentes.length > 0) {
            preciosExistentes.forEach(precio => {
              if (precio.principal && precio.id !== this.precioInput.id) {
                // Crear input para la actualización
                const updateInput = new PrecioPorSucursalInput();
                updateInput.id = precio.id;
                updateInput.precio = precio.precio;
                updateInput.activo = precio.activo;
                updateInput.principal = false;
                updateInput.presentacionId = this.data.presentacion.id;
                updateInput.tipoPrecioId = precio.tipoPrecio?.id;
                updateInput.sucursalId = this.mainService?.sucursalActual?.id;
                updateInput.usuarioId = null;
                
                updatePromises.push(
                  this.precioService.onSave(updateInput, false).pipe(untilDestroyed(this))
                );
              }
            });
          }

          if (updatePromises.length > 0) {
            Promise.all(updatePromises.map(promise => promise.toPromise()))
              .then(() => {
                this.guardarPrecio();
              })
              .catch(error => {
                console.error('Error al actualizar precios principales:', error);
                this.guardarPrecio();
              });
          } else {
            this.guardarPrecio();
          }
        });
    } else {
      this.guardarPrecio();
    }
  }

  private guardarPrecio() {
    this.precioInput.sucursalId = this.mainService?.sucursalActual?.id;
    
    this.precioService.onSave(this.precioInput).pipe(untilDestroyed(this)).subscribe(res => {
      this.cargandoDialog.closeDialog();
      if (res != null) {
        this.matDialogRef.close(res);
      }
    }, error => {
      this.cargandoDialog.closeDialog();
      this.notificacionSnackBar.notification$.next({
        texto: "Error al guardar el precio",
        color: NotificacionColor.warn,
        duracion: 3
      });
    });
  }

  onCancelar() {
    this.matDialogRef.close()
  }

}
