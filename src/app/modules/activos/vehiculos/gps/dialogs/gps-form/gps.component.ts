import { Component, Inject, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Gps } from '../../models/gps.model';
import { GpsService } from '../../service/gps.service';
import { Vehiculo } from '../../../vehiculo/models/vehiculo.model';
import { GpsDialogService } from '../../service/gps-dialog-service.service';

@UntilDestroy()
@Component({
    selector: 'app-gps-form',
    templateUrl: './gps.component.html',
    styleUrls: ['./gps.component.scss']
})
export class GPSComponent implements OnInit {
    private fb = inject(FormBuilder);
    private gpsService = inject(GpsService);
    private gpsDialogService = inject(GpsDialogService);
    private cdr = inject(ChangeDetectorRef);

    form: FormGroup;
    gps: Gps;
    vehiculoSelected: Vehiculo | null = null;
    vehiculoDescripcion: string = 'SELECCIONE UN VEHICULO';

    imeiControl = new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]);
    modeloTrackerControl = new FormControl('', [Validators.required]);
    simNumeroControl = new FormControl('');
    activoControl = new FormControl(true);
    vehiculoIdControl = new FormControl<number | null>(null);

    constructor(
        public dialogRef: MatDialogRef<GPSComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Gps
    ) { }

    ngOnInit(): void {
        this.gps = this.data;
        this.inicializarFormulario();

        if (this.gps?.id) {
            this.cargarDatos();
        }
    }

    private inicializarFormulario(): void {
        this.form = this.fb.group({
            id: [null],
            imei: this.imeiControl,
            modeloTracker: this.modeloTrackerControl,
            simNumero: this.simNumeroControl,
            activo: this.activoControl,
            vehiculoId: this.vehiculoIdControl
        });
    }

    private cargarDatos(): void {
        if (this.gps) {
            this.form.patchValue({
                id: this.gps.id,
                imei: this.gps.imei,
                modeloTracker: this.gps.modeloTracker,
                simNumero: this.gps.simNumero,
                activo: this.gps.activo,
                vehiculoId: this.gps.vehiculo?.id || null
            });

            if (this.gps.vehiculo) {
                this.vehiculoSelected = this.gps.vehiculo;
                this.actualizarVehiculoDescripcion();
            }
        }
    }

    private actualizarVehiculoDescripcion(): void {
        if (this.vehiculoSelected) {
            this.vehiculoDescripcion = `${this.vehiculoSelected.chapa} - ${this.vehiculoSelected.modelo?.descripcion || ''}`.toUpperCase();
        } else {
            this.vehiculoDescripcion = 'SELECCIONE UN VEHICULO';
        }
    }

    onBuscarVehiculo(): void {
        this.gpsDialogService.onBuscarVehiculo((vehiculo: Vehiculo) => {
            if (vehiculo) {
                this.vehiculoSelected = vehiculo;
                this.actualizarVehiculoDescripcion();
                this.vehiculoIdControl.setValue(Number(vehiculo.id));
                this.cdr.markForCheck();
            }
        });
    }

    onLimpiarVehiculo(event: Event): void {
        event.stopPropagation();
        this.vehiculoSelected = null;
        this.vehiculoDescripcion = 'SELECCIONE UN VEHICULO';
        this.vehiculoIdControl.setValue(null);
        this.cdr.markForCheck();
    }

    onGuardar(): void {
        if (this.form.valid) {
            this.gpsService.onSave(this.form.getRawValue()).subscribe(res => {
                if (res) this.dialogRef.close(true);
            });
        }
    }

    onCancelar(): void {
        this.dialogRef.close();
    }
}
