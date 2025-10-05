import { forkJoin } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { TimbradoDetalle } from '../timbrado.modal';
import { TimbradoService } from '../timbrado.service';
import { MainService } from '../../../../main.service';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { PuntoDeVenta } from '../../punto-de-venta/punto-de-venta.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { PuntoDeVentaService } from '../../punto-de-venta/punto-de-venta.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

export interface AddTimbradoDetalleDialogData {
  timbrado?: any; // Timbrado padre al que pertenece el detalle
  timbradoDetalle: TimbradoDetalle;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-timbrado-detalle-dialog',
  templateUrl: './add-timbrado-detalle-dialog.component.html',
  styleUrls: ['./add-timbrado-detalle-dialog.component.scss']
})
export class AddTimbradoDetalleDialogComponent implements OnInit {

  isEditing = false;
  timbradoPadre: any; // Timbrado padre para verificar si es electrónico
  sucursales: Sucursal[] = [];
  puntosDeVenta: PuntoDeVenta[] = [];
  puntosDeVentaFiltrados: PuntoDeVenta[] = [];
  selectedTimbradoDetalle: TimbradoDetalle;

  formGroup: FormGroup;
  ciudadControl = new FormControl(null);
  barrioControl = new FormControl(null);
  activoControl = new FormControl(false);
  usuarioControl = new FormControl(null);
  localidadControl = new FormControl(null);
  telefonoControl = new FormControl(null);
  timbradoControl = new FormControl(null);
  direccionControl = new FormControl(null);
  codCiudadControl = new FormControl(null);
  rangoDesdeControl = new FormControl(null);
  rangoHastaControl = new FormControl(null);
  departamentoControl = new FormControl(null);
  numeroActualControl = new FormControl(null);
  sucursalControl = new FormControl(null, Validators.required);
  cantidadControl = new FormControl(null, Validators.required);
  puntoExpedicionControl = new FormControl(null, Validators.required);
  puntoVentaControl = new FormControl({value: null, disabled: true}, Validators.required);


  constructor(
    private mainService: MainService,
    private timbradoService: TimbradoService,
    private sucursalService: SucursalService,
    private puntoDeVentaService: PuntoDeVentaService,
    private notificacionService: NotificacionSnackbarService,
    @Inject(MAT_DIALOG_DATA) private data: AddTimbradoDetalleDialogData,
    private matDialogRef: MatDialogRef<AddTimbradoDetalleDialogComponent>

  ) { 

    if (data?.timbradoDetalle != null) {
      this.selectedTimbradoDetalle = data.timbradoDetalle;

      if (data?.timbrado) {
        this.timbradoPadre = data.timbrado;
      }
    } else {
      this.selectedTimbradoDetalle = new TimbradoDetalle();
      
      if (data?.timbrado) {
        this.selectedTimbradoDetalle.timbrado = data.timbrado;
        this.timbradoPadre = data.timbrado;
      }
    }
  }

  ngOnInit() : void {
    this.formGroup = new FormGroup({
      ciudadControl: this.ciudadControl,
      barrioControl: this.barrioControl,
      activoControl: this.activoControl,
      usuarioControl: this.usuarioControl,
      sucursalControl: this.sucursalControl,
      cantidadControl: this.cantidadControl,
      telefonoControl: this.telefonoControl,
      timbradoControl: this.timbradoControl,
      codCiudadControl: this.codCiudadControl,
      direccionControl: this.direccionControl,
      localidadControl: this.localidadControl,
      puntoVentaControl: this.puntoVentaControl,
      rangoDesdeControl: this.rangoDesdeControl,
      rangoHastaControl: this.rangoHastaControl,
      departamentoControl: this.departamentoControl,
      numeroActualControl: this.numeroActualControl,
      puntoExpedicionControl: this.puntoExpedicionControl,
    });

    this.loadInitialData();
    this.setupSucursalChangeListener();
    this.configurarValidacionesSegunTimbrado();
  }

  configurarValidacionesSegunTimbrado() {
    if (this.timbradoPadre?.isElectronico) {

      this.cantidadControl.clearValidators();
      this.cantidadControl.setValue(9999999);
    } else {

      this.cantidadControl.setValidators([Validators.required]);
    }
    this.cantidadControl.updateValueAndValidity();
  }

  loadInitialData() {
    forkJoin({
      sucursales: this.sucursalService.onGetAllSucursales(true, true),
      puntoDeVentas: this.puntoDeVentaService.onGetAllPuntoDeVentas(true)
    }).pipe(untilDestroyed(this)).subscribe({
      next: ({ sucursales, puntoDeVentas }) => {

        this.sucursales = (sucursales || []).filter(sucursal => 
          sucursal.nombre !== "SERVIDOR" && sucursal.nombre !== "COMPRAS"
        );
        
        this.puntosDeVenta = puntoDeVentas || [];
        
        if (this.selectedTimbradoDetalle.id) {

          requestAnimationFrame(() => {
            this.cargarDatos();
            this.isEditing = false;
            this.formGroup.disable();
          });
        } else {
          this.isEditing = true;
          this.activoControl.setValue(true);
        }
      },
      error: (error) => {
        console.error('Error al cargar datos iniciales:', error);
      }
    });
  }

  cargarDatos() {
    let sucursalEncontrada = null;
    
    if (this.selectedTimbradoDetalle.sucursal) {
      if (typeof this.selectedTimbradoDetalle.sucursal === 'string') {
      
        const sucursalString = this.selectedTimbradoDetalle.sucursal as string;
        const nombreBuscado = sucursalString.trim();
        sucursalEncontrada = this.sucursales.find(s => s.nombre === nombreBuscado);
      } else if (this.selectedTimbradoDetalle.sucursal.id) {
        
        sucursalEncontrada = this.sucursales.find(s => s.id == this.selectedTimbradoDetalle.sucursal.id);
      }
    }

    if (sucursalEncontrada) {
      this.sucursalControl.setValue(sucursalEncontrada);
      
      
      this.puntosDeVentaFiltrados = this.puntosDeVenta.filter(pv => 
        pv.sucursal?.id == sucursalEncontrada.id
      );
      
      
      if (this.selectedTimbradoDetalle.puntoDeVenta?.id) {
        const puntoVentaEncontrado = this.puntosDeVentaFiltrados.find(pv => 
          pv.id == this.selectedTimbradoDetalle.puntoDeVenta.id
        );
        
        if (puntoVentaEncontrado) {
          this.puntoVentaControl.setValue(puntoVentaEncontrado);
        }
      }
    }

    this.ciudadControl.setValue(this.selectedTimbradoDetalle.ciudad);
    this.barrioControl.setValue(this.selectedTimbradoDetalle.barrio);
    this.activoControl.setValue(this.selectedTimbradoDetalle.activo);
    this.usuarioControl.setValue(this.selectedTimbradoDetalle.usuario);
    this.cantidadControl.setValue(this.selectedTimbradoDetalle.cantidad);
    this.telefonoControl.setValue(this.selectedTimbradoDetalle.telefono);
    this.timbradoControl.setValue(this.selectedTimbradoDetalle.timbrado);
    this.localidadControl.setValue(this.selectedTimbradoDetalle.localidad);
    this.direccionControl.setValue(this.selectedTimbradoDetalle.direccion);
    this.rangoDesdeControl.setValue(this.selectedTimbradoDetalle.rangoDesde);
    this.rangoHastaControl.setValue(this.selectedTimbradoDetalle.rangoHasta);
    this.codCiudadControl.setValue(this.selectedTimbradoDetalle.codigoCiudad);
    this.departamentoControl.setValue(this.selectedTimbradoDetalle.departamento);
    this.numeroActualControl.setValue(this.selectedTimbradoDetalle.numeroActual);
    this.puntoExpedicionControl.setValue(this.selectedTimbradoDetalle.puntoExpedicion);
  }

  setupSucursalChangeListener() {
    this.sucursalControl.valueChanges.pipe(
      untilDestroyed(this),
      debounceTime(100)
    ).subscribe(sucursalSeleccionada => {
      if (sucursalSeleccionada) {

        if (this.isEditing) {
          this.puntoVentaControl.enable();
        }

        this.puntosDeVentaFiltrados = this.puntosDeVenta.filter(pv => 
          pv.sucursal?.id === sucursalSeleccionada.id
        );

        const puntoVentaActual = this.puntoVentaControl.value;
        if (puntoVentaActual && !this.puntosDeVentaFiltrados.some(pv => pv.id === puntoVentaActual.id)) {
          this.puntoVentaControl.setValue(null);
        }
      } else {
        this.puntoVentaControl.disable();
        this.puntosDeVentaFiltrados = [];
        this.puntoVentaControl.setValue(null);
      }
    });
  }

  onGuardar() {
    if (this.formGroup.invalid) {
      this.notificacionService.openWarn('Por favor complete todos los campos requeridos');
      return;
    }
    
    this.selectedTimbradoDetalle.sucursal = this.sucursalControl.value;
    this.selectedTimbradoDetalle.puntoDeVenta = this.puntoVentaControl.value;
    this.selectedTimbradoDetalle.puntoExpedicion = this.puntoExpedicionControl.value;
    
    if (this.timbradoPadre?.isElectronico) {

      this.selectedTimbradoDetalle.rangoDesde = 1;
      this.selectedTimbradoDetalle.numeroActual = 0;
      this.selectedTimbradoDetalle.cantidad = 9999999;
      this.selectedTimbradoDetalle.rangoHasta = 9999999;
    } else {

      this.selectedTimbradoDetalle.cantidad = this.cantidadControl.value;
    }
    if (!this.selectedTimbradoDetalle.id) {

      this.selectedTimbradoDetalle.rangoDesde = 1;
      this.selectedTimbradoDetalle.numeroActual = 0;
      this.selectedTimbradoDetalle.rangoHasta = this.cantidadControl.value;
    } else {

      this.selectedTimbradoDetalle.rangoDesde = this.rangoDesdeControl.value;
      this.selectedTimbradoDetalle.rangoHasta = this.rangoHastaControl.value;
      this.selectedTimbradoDetalle.numeroActual = this.numeroActualControl.value;
    }
    
    this.selectedTimbradoDetalle.telefono = this.telefonoControl.value;
    this.selectedTimbradoDetalle.usuario = this.mainService.usuarioActual;
    this.selectedTimbradoDetalle.codigoCiudad = this.codCiudadControl.value;
    this.selectedTimbradoDetalle.activo = this.activoControl.value ?? false;
    this.selectedTimbradoDetalle.ciudad = this.ciudadControl.value?.toUpperCase();
    this.selectedTimbradoDetalle.barrio = this.barrioControl.value?.toUpperCase();
    this.selectedTimbradoDetalle.localidad = this.localidadControl.value?.toUpperCase();
    this.selectedTimbradoDetalle.direccion = this.direccionControl.value?.toUpperCase();
    this.selectedTimbradoDetalle.departamento = this.departamentoControl.value?.toUpperCase();

    let aux = new TimbradoDetalle();
    Object.assign(aux, this.selectedTimbradoDetalle);

    const inputData = aux.toInput();
    

    this.timbradoService.onSaveTimbradoDetalle(inputData).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.notificacionService.openSucess('Guardado exitosamente');
        this.matDialogRef.close(true);
      },
      error: (error) => {
        this.notificacionService.openAlgoSalioMal('Error al guardar: ' + (error.message || error));
      }
    });
  }

  onCancelar() {
    this.matDialogRef.close();
  }

  onHabilitarEdicion() {
    this.isEditing = true;
    this.formGroup.enable();
    
    if (this.sucursalControl.value) {
      this.puntoVentaControl.enable();
    }
  }

}
