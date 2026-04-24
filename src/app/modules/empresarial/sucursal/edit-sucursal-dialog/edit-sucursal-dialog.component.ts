import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from '../sucursal.model';
import { SucursalService } from '../sucursal.service';
import { Ciudad } from '../../../general/ciudad/ciudad.model';
import { CiudadService } from '../../../general/ciudad/ciudad.service';
import { MainService } from '../../../../main.service';
import { forkJoin } from 'rxjs';

export interface SucursalDialogData {
  sucursal: Sucursal;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-sucursal-dialog',
  templateUrl: './edit-sucursal-dialog.component.html',
  styleUrls: ['./edit-sucursal-dialog.component.scss']
})
export class EditSucursalDialogComponent implements OnInit {

  selectedSucursal: Sucursal;
  formGroup: FormGroup;
  isEditting = false;

  // Form controls
  nombreControl = new FormControl(null, [Validators.required]);
  localizacionControl = new FormControl(null, [Validators.required]);
  ciudadControl = new FormControl(null, [Validators.required]);
  depositoControl = new FormControl(false);
  depositoPredeterminadoControl = new FormControl(false);
  codigoEstablecimientoFacturaControl = new FormControl(null);
  // IP control with pattern validation for IPv4
  ipControl = new FormControl(null, [
    Validators.pattern('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$')
  ]);
  // Puerto control with range validation
  puertoControl = new FormControl(null, [
    Validators.min(0),
    Validators.max(65535)
  ]);
  // New form controls for the additional fields
  direccionControl = new FormControl(null);
  nroDeliveryControl = new FormControl(null);
  isConfiguredControl = new FormControl(false);
  activoControl = new FormControl(true); // Por defecto activo

  // Lists for selects
  ciudadList: Ciudad[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: SucursalDialogData,
    private dialogRef: MatDialogRef<EditSucursalDialogComponent>,
    private sucursalService: SucursalService,
    private ciudadService: CiudadService,
    private mainService: MainService
  ) { 
    if (data?.sucursal != null) {
      this.selectedSucursal = data.sucursal;
    } else {
      this.selectedSucursal = new Sucursal();
    }
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nombre: this.nombreControl,
      localizacion: this.localizacionControl,
      ciudad: this.ciudadControl,
      deposito: this.depositoControl,
      depositoPredeterminado: this.depositoPredeterminadoControl,
      codigoEstablecimientoFactura: this.codigoEstablecimientoFacturaControl,
      ip: this.ipControl,
      puerto: this.puertoControl,
      // Add new fields to form group
      direccion: this.direccionControl,
      nroDelivery: this.nroDeliveryControl,
      isConfigured: this.isConfiguredControl,
      activo: this.activoControl
    });

    // Load initial data
    this.loadInitialData();

    if (this.selectedSucursal.id) {
      this.cargarDatos();
    } else {
      this.isEditting = true;
    }
  }

  loadInitialData() {
    // Load ciudades from CiudadService
    this.ciudadService.getAllCiudades()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (ciudades) => {
          if (ciudades && ciudades.length > 0) {
            this.ciudadList = ciudades;
          } else {
            console.warn('No se encontraron ciudades');
          }
        },
        error: (error) => {
          console.error('Error al cargar ciudades:', error);
          // Fallback to mock data if there's an error
          const mockCiudades = [
            { id: 1, descripcion: 'ASUNCIÓN', creadoEn: new Date(), usuario: this.mainService.usuarioActual },
            { id: 2, descripcion: 'CIUDAD DEL ESTE', creadoEn: new Date(), usuario: this.mainService.usuarioActual },
            { id: 3, descripcion: 'ENCARNACIÓN', creadoEn: new Date(), usuario: this.mainService.usuarioActual }
          ];
          this.ciudadList = mockCiudades as Ciudad[];
        }
      });
  }

  cargarDatos() {
    this.nombreControl.setValue(this.selectedSucursal.nombre);
    this.localizacionControl.setValue(this.selectedSucursal.localizacion);
    this.ciudadControl.setValue(this.selectedSucursal.ciudad?.id);
    this.depositoControl.setValue(this.selectedSucursal.deposito ?? false);
    this.depositoPredeterminadoControl.setValue(this.selectedSucursal.depositoPredeterminado ?? false);
    this.codigoEstablecimientoFacturaControl.setValue(this.selectedSucursal.codigoEstablecimientoFactura);
    this.ipControl.setValue(this.selectedSucursal.ip);
    this.puertoControl.setValue(this.selectedSucursal.puerto);
    this.direccionControl.setValue(this.selectedSucursal.direccion);
    this.nroDeliveryControl.setValue(this.selectedSucursal.nroDelivery);
    this.isConfiguredControl.setValue(this.selectedSucursal.isConfigured ?? false);
    this.activoControl.setValue(this.selectedSucursal.activo ?? false);

    this.formGroup.disable();
  }

  onHabilitarEdicion() {
    this.isEditting = true;
    this.formGroup.enable();
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) {
      return;
    }

    // Update selected sucursal with form values
    this.selectedSucursal.nombre = this.nombreControl.value?.toUpperCase();
    this.selectedSucursal.localizacion = this.localizacionControl.value?.toUpperCase();
    
    // Find selected ciudad object
    const ciudadId = this.ciudadControl.value;
    this.selectedSucursal.ciudad = this.ciudadList.find(c => c.id === ciudadId);
    
    this.selectedSucursal.deposito = this.depositoControl.value ?? false;
    this.selectedSucursal.depositoPredeterminado = this.depositoPredeterminadoControl.value ?? false;
    this.selectedSucursal.codigoEstablecimientoFactura = this.codigoEstablecimientoFacturaControl.value?.toUpperCase();
    this.selectedSucursal.ip = this.ipControl.value;
    this.selectedSucursal.puerto = this.puertoControl.value;
    this.selectedSucursal.direccion = this.direccionControl.value?.toUpperCase();
    this.selectedSucursal.nroDelivery = this.nroDeliveryControl.value?.toUpperCase();
    this.selectedSucursal.isConfigured = this.isConfiguredControl.value ?? false;
    this.selectedSucursal.activo = this.activoControl.value ?? false;
    
    // Set/update user for both new and existing sucursals
    this.selectedSucursal.usuario = this.mainService.usuarioActual;

    // Save to backend
    let aux = new Sucursal();
    Object.assign(aux, this.selectedSucursal);
    
    this.sucursalService.onSaveSucursal(aux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dialogRef.close(res);
        }
      });
  }
} 