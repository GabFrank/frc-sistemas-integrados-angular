import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';

// Interfaces
interface Sucursal {
  id: number;
  nombre: string;
  codigoEstablecimientoFactura: string;
}

interface NotaRecepcionItemMock {
  id: number;
  producto: { id: number; descripcion: string; codigo?: string };
  cantidadEsperada: number;
  cantidadRecibida: number;
  cantidadRechazada: number;
  estado: string;
  notaRecepcionId: number;
}

interface DistribucionSucursal {
  sucursalId: number;
  sucursalNombre: string;
  cantidadEsperada: number;
  seleccionada: boolean;
}

export interface VerificacionRapidaSucursalesDialogData {
  item: NotaRecepcionItemMock;
  sucursalesSeleccionadas: Sucursal[];
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-verificacion-rapida-sucursales-dialog',
  templateUrl: './verificacion-rapida-sucursales-dialog.component.html',
  styleUrls: ['./verificacion-rapida-sucursales-dialog.component.scss']
})
export class VerificacionRapidaSucursalesDialogComponent implements OnInit {
  @ViewChild('saveButton', { read: MatButton }) saveButton!: MatButton;
  @ViewChild('cancelButton', { read: MatButton }) cancelButton!: MatButton;

  private destroy$ = new Subject<void>();

  // Formulario de selección
  seleccionForm: FormGroup;

  // Datos del ítem y sucursales
  item: NotaRecepcionItemMock;
  sucursalesSeleccionadas: Sucursal[];

  // Distribuciones por sucursal
  distribuciones: DistribucionSucursal[] = [];

  // Computed properties para UI
  cantidadTotalEsperadaComputed = 0;
  sucursalesSeleccionadasComputed = 0;
  formValidComputed = false;
  todasSeleccionadasComputed = false;
  ningunaSeleccionadaComputed = true;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<VerificacionRapidaSucursalesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerificacionRapidaSucursalesDialogData
  ) {
    this.item = data.item;
    this.sucursalesSeleccionadas = data.sucursalesSeleccionadas;
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeDistribuciones();
    this.setupFormSubscriptions();
    this.updateComputedProperties();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.seleccionForm = this.fb.group({
      // Los controles se agregarán dinámicamente en initializeDistribuciones
    });
  }

  private initializeDistribuciones(): void {
    // Crear distribuciones por sucursal
    this.distribuciones = this.sucursalesSeleccionadas.map(sucursal => ({
      sucursalId: sucursal.id,
      sucursalNombre: sucursal.nombre,
      cantidadEsperada: Math.floor(this.item.cantidadEsperada / this.sucursalesSeleccionadas.length),
      seleccionada: true // Por defecto todas seleccionadas
    }));

    // Agregar campos de formulario para cada distribución
    this.distribuciones.forEach(dist => {
      this.seleccionForm.addControl(
        `seleccionada_${dist.sucursalId}`,
        this.fb.control(true, Validators.required)
      );
    });
  }

  private setupFormSubscriptions(): void {
    // Monitorear cambios en el formulario
    this.seleccionForm.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    // Monitorear validación del formulario
    this.seleccionForm.statusChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });
  }

  private updateComputedProperties(): void {
    // Calcular cantidad total esperada
    this.cantidadTotalEsperadaComputed = this.distribuciones.reduce((sum, dist) => sum + dist.cantidadEsperada, 0);

    // Contar sucursales seleccionadas
    this.sucursalesSeleccionadasComputed = this.distribuciones.filter(dist => {
      const control = this.seleccionForm.get(`seleccionada_${dist.sucursalId}`);
      return control ? control.value : false;
    }).length;

    // Verificar si todas están seleccionadas
    this.todasSeleccionadasComputed = this.sucursalesSeleccionadasComputed === this.distribuciones.length;

    // Verificar si ninguna está seleccionada
    this.ningunaSeleccionadaComputed = this.sucursalesSeleccionadasComputed === 0;

    // Validar formulario (al menos una sucursal debe estar seleccionada)
    this.formValidComputed = this.seleccionForm.valid && this.sucursalesSeleccionadasComputed > 0;
  }

  onSeleccionarTodas(): void {
    this.distribuciones.forEach(dist => {
      const control = this.seleccionForm.get(`seleccionada_${dist.sucursalId}`);
      if (control) {
        control.setValue(true);
      }
    });
  }

  onDeseleccionarTodas(): void {
    this.distribuciones.forEach(dist => {
      const control = this.seleccionForm.get(`seleccionada_${dist.sucursalId}`);
      if (control) {
        control.setValue(false);
      }
    });
  }

  onToggleSucursal(sucursalId: number): void {
    const control = this.seleccionForm.get(`seleccionada_${sucursalId}`);
    if (control) {
      control.setValue(!control.value);
    }
  }

  onSave(): void {
    if (!this.formValidComputed) {
      return;
    }

    // Preparar datos para guardar
    const sucursalesVerificadas = this.distribuciones
      .filter(dist => {
        const control = this.seleccionForm.get(`seleccionada_${dist.sucursalId}`);
        return control ? control.value : false;
      })
      .map(dist => ({
        sucursalId: dist.sucursalId,
        cantidadRecibida: dist.cantidadEsperada
      }));

    const result = {
      itemId: this.item.id,
      sucursalesVerificadas: sucursalesVerificadas,
      cantidadTotalRecibida: sucursalesVerificadas.reduce((sum, s) => sum + s.cantidadRecibida, 0)
    };

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Métodos auxiliares para UI
  getSucursalControl(sucursalId: number) {
    return this.seleccionForm.get(`seleccionada_${sucursalId}`);
  }

  isSucursalSeleccionada(sucursalId: number): boolean {
    const control = this.getSucursalControl(sucursalId);
    return control ? control.value : false;
  }

  getCantidadTotalSeleccionada(): number {
    return this.distribuciones
      .filter(dist => this.isSucursalSeleccionada(dist.sucursalId))
      .reduce((sum, dist) => sum + dist.cantidadEsperada, 0);
  }
} 