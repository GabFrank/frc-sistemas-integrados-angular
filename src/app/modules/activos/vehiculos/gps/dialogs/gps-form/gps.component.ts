import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GpsService } from '../../service/gps.service';
import { GpsDialogService } from '../../service/gps-dialog-service.service';
import { Gps } from '../../models/gps.model';
import { Vehiculo } from '../../../vehiculo/models/vehiculo.model';

@UntilDestroy()
@Component({
    selector: 'app-gps',
    templateUrl: './gps.component.html',
    styleUrls: ['./gps.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GpsComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly gpsDialogService = inject(GpsDialogService);
    private readonly cdr = inject(ChangeDetectorRef);
    public readonly dialogRef = inject(MatDialogRef<GpsComponent>);
    public readonly data = inject<Gps>(MAT_DIALOG_DATA);

    form: FormGroup;
    gps: Gps = this.data;
    vehiculoSelected: Vehiculo | null = null;
    vehiculoDescripcion: string = 'SELECCIONE UN VEHICULO';

    ngOnInit(): void {
        this.inicializarFormulario();

        if (this.gps?.id) {
            this.cargarDatos();
        }
    }

    private inicializarFormulario(): void {
        this.form = this.fb.group({
            id: [this.gps?.id || null],
            imei: [this.gps?.imei || null, [Validators.required]],
            modeloTracker: [this.gps?.modeloTracker || null, [Validators.required]],
            simNumero: [this.gps?.simNumero || null],
            vehiculoId: [this.gps?.vehiculo?.id || null],
            activo: [this.gps?.id ? this.gps.activo : true]
        });

        if (this.gps?.vehiculo) {
            this.vehiculoSelected = this.gps.vehiculo;
            this.actualizarVehiculoDescripcion();
        }
    }

    private cargarDatos(): void {
        if (this.gps.vehiculo) {
            this.vehiculoSelected = this.gps.vehiculo;
            this.actualizarVehiculoDescripcion();
        }
        this.cdr.markForCheck();
    }

    private actualizarVehiculoDescripcion(): void {
        if (this.vehiculoSelected) {
            this.vehiculoDescripcion = `${this.vehiculoSelected.chapa} - ${this.vehiculoSelected.modelo?.descripcion || ''}`.toUpperCase();
        } else {
            this.vehiculoDescripcion = 'SELECCIONE UN VEHICULO';
        }
    }

    getControlValue(controlName: string): any {
        return this.form.get(controlName)?.value;
    }

    hasError(controlName: string, errorName: string): boolean {
        return this.form.get(controlName)?.hasError(errorName) || false;
    }

    onBuscarVehiculo(): void {
        this.gpsDialogService.onBuscarVehiculo((vehiculo: Vehiculo) => {
            this.vehiculoSelected = vehiculo;
            this.form.get('vehiculoId')?.setValue(vehiculo.id);
            this.actualizarVehiculoDescripcion();
            this.cdr.markForCheck();
        });
    }

    onLimpiarVehiculo(event: Event): void {
        event.stopPropagation();
        this.vehiculoSelected = null;
        this.form.get('vehiculoId')?.setValue(null);
        this.actualizarVehiculoDescripcion();
    }

    onGuardar(): void {
        this.gpsDialogService.onGuardar(this.form, this.dialogRef);
    }

    onCancelar(): void {
        this.gpsDialogService.onCancelar(this.dialogRef);
    }
}
