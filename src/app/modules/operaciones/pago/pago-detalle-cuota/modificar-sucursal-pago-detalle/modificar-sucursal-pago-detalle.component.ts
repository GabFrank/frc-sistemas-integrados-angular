import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaBalance, PdvCaja } from '../../../../financiero/pdv/caja/caja.model';
import { CajaService } from '../../../../financiero/pdv/caja/caja.service';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { PagoDetalleCuota } from '../pago-detalle-cuota.model';
import { Observable, catchError, debounceTime, distinctUntilChanged, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { PagoDetalleCuotaService } from '../pago-detalle-cuota.service';

export interface ModificarSucursalPagoDetalleData {
  pagoDetalleCuota: PagoDetalleCuota;
}

@UntilDestroy()
@Component({
  selector: 'app-modificar-sucursal-pago-detalle',
  templateUrl: './modificar-sucursal-pago-detalle.component.html',
  styleUrls: ['./modificar-sucursal-pago-detalle.component.scss']
})
export class ModificarSucursalPagoDetalleComponent implements OnInit {
  sucursales: Sucursal[] = [];
  filteredSucursales: Observable<Sucursal[]>;
  sucursalControl = new FormControl<Sucursal | null>(null);
  selectedCajaControl = new FormControl<PdvCaja | null>(null);
  dataSource = new MatTableDataSource<PdvCaja>([]);
  displayedColumns: string[] = ['select', 'cajaId', 'cajero', 'diferenciaGs', 'diferenciaRs', 'diferenciaDs'];
  cargando = false;
  error = '';

  constructor(
    public dialogRef: MatDialogRef<ModificarSucursalPagoDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModificarSucursalPagoDetalleData,
    private sucursalService: SucursalService,
    private cajaService: CajaService,
    private pagoDetalleCuotaService: PagoDetalleCuotaService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.cargarSucursales();
    
    // Setup filteredSucursales observable
    this.filteredSucursales = this.sucursalControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        const nombre = typeof value === 'string' ? value : value?.nombre;
        return nombre ? this._filterSucursales(nombre) : this.sucursales.slice();
      })
    );

    // When sucursal changes, load cajas
    this.sucursalControl.valueChanges.pipe(
      untilDestroyed(this),
      distinctUntilChanged(),
      switchMap(sucursal => {
        if (sucursal && typeof sucursal !== 'string') {
          this.cargando = true;
          this.dataSource.data = [];
          this.error = '';
          // Reset selected caja when changing sucursal
          this.selectedCajaControl.setValue(null);
          return this.loadCajasAbiertas(sucursal.id);
        }
        return of([]);
      })
    ).subscribe({
      next: (cajas) => {
        this.cargando = false;
        if (cajas && cajas.length > 0) {
          this.dataSource.data = cajas;
        }
      },
      error: (err) => {
        this.cargando = false;
        this.error = 'Error al cargar cajas: ' + (err.message || 'Error desconocido');
        this.notificacionService.openWarn(this.error);
      }
    });
  }

  cargarSucursales(): void {
    this.sucursalService.onGetAllSucursales(true, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (sucursales) => {
          if (sucursales) {
            this.sucursales = sucursales;
            
            // If the pagoDetalleCuota has a sucursal, select it by default
            if (this.data.pagoDetalleCuota?.pagoDetalle?.sucursal) {
              const sucursalActual = this.sucursales.find(
                s => s.id === this.data.pagoDetalleCuota.pagoDetalle.sucursal.id
              );
              if (sucursalActual) {
                this.sucursalControl.setValue(sucursalActual);
              }
            }
          }
        },
        error: (err) => {
          this.notificacionService.openWarn('Error al cargar sucursales: ' + (err.message || 'Error desconocido'));
        }
      });
  }

  loadCajasAbiertas(sucursalId: number): Observable<PdvCaja[]> {
    // Using the new method to get all open cajas by sucursal ID with their balances
    return this.cajaService.onGetCajasAbiertasPorSucursal(sucursalId).pipe(
      catchError(error => {
        console.error('Error loading cajas:', error);
        return of([]);
      })
    );
  }
  
  selectCaja(caja: PdvCaja): void {
    if (this.selectedCajaControl.value?.id === caja.id) {
      // If clicking on the already selected caja, deselect it
      this.selectedCajaControl.setValue(null);
    } else {
      // Select the new caja
      this.selectedCajaControl.setValue(caja);
    }
  }
  
  isSelected(caja: PdvCaja): boolean {
    return this.selectedCajaControl.value?.id === caja.id;
  }

  displaySucursal(sucursal: Sucursal): string {
    return sucursal && sucursal.nombre ? sucursal.nombre : '';
  }

  private _filterSucursales(nombre: string): Sucursal[] {
    const filterValue = nombre.toLowerCase();
    return this.sucursales.filter(sucursal => 
      sucursal.nombre.toLowerCase().includes(filterValue)
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.sucursalControl.value) {
      this.notificacionService.openWarn('Debe seleccionar una sucursal');
      return;
    }
    
    // Return both the selected sucursal and caja (if any)
    this.dialogRef.close({
      sucursal: this.sucursalControl.value,
      caja: this.selectedCajaControl.value
    });
  }
} 