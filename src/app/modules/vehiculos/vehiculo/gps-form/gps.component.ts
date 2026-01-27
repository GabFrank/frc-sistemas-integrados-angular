import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, Optional, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GpsService } from '../gps.service';
import { Gps } from '../models/gps.model';
import { GpsInput } from '../models/gps-input.model';
import { Vehiculo } from '../models/vehiculo.model';
import { BuscarVehiculoDialogComponent } from '../buscar-vehiculo-dialog/buscar-vehiculo-dialog.component';

@UntilDestroy()
@Component({
    selector: 'app-gps',
    templateUrl: './gps.component.html',
    styleUrls: ['./gps.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GpsComponent implements OnInit {
    private fb = inject(FormBuilder);
    private gpsService = inject(GpsService);
    private matDialog = inject(MatDialog);
    private cdr = inject(ChangeDetectorRef);

    constructor(
        @Optional() public dialogRef: MatDialogRef<GpsComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: Gps
    ) { }

    form: FormGroup;
    gps: Gps;
    vehiculoSelected: Vehiculo | null = null;

    get vehiculoDescripcion(): string {
        if (this.vehiculoSelected) {
            return `${this.vehiculoSelected.chapa} - ${this.vehiculoSelected.modelo?.descripcion || ''}`.toUpperCase();
        }
        return 'SELECCIONE UN VEHICULO';
    }

    ngOnInit(): void {
        this.gps = this.data;
        this.inicializarFormulario();

        if (this.gps?.id) {
            this.cargarDatos();
        } else {
            this.form.patchValue({ activo: true });
        }
    }

    private inicializarFormulario(): void {
        this.form = this.fb.group({
            id: [null],
            imei: [null, [Validators.required]],
            modeloTracker: [null, [Validators.required]],
            simNumero: [null],
            vehiculoId: [null],
            activo: [true]
        });
    }

    private cargarDatos(): void {
        this.form.patchValue({
            id: this.gps.id,
            imei: this.gps.imei,
            modeloTracker: this.gps.modeloTracker,
            simNumero: this.gps.simNumero,
            vehiculoId: this.gps.vehiculo?.id,
            activo: this.gps.activo
        });

        if (this.gps.vehiculo) {
            this.vehiculoSelected = this.gps.vehiculo;
        }
        this.cdr.markForCheck();
    }

    onBuscarVehiculo(): void {
        const dialogRef = this.matDialog.open(BuscarVehiculoDialogComponent, {
            width: '800px',
            disableClose: true,
            autoFocus: false
        });

        dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
            if (res) {
                this.vehiculoSelected = res;
                this.form.get('vehiculoId')?.setValue(res.id);
                this.cdr.markForCheck();
            }
        });
    }

    onLimpiarVehiculo(event: Event): void {
        event.stopPropagation();
        this.vehiculoSelected = null;
        this.form.get('vehiculoId')?.setValue(null);
    }

    onGuardar(): void {
        if (this.form.valid) {
            const values = this.form.getRawValue();
            const input: GpsInput = {
                id: values.id,
                imei: values.imei,
                modeloTracker: values.modeloTracker,
                simNumero: values.simNumero,
                vehiculoId: values.vehiculoId,
                activo: values.activo
            };

            this.gpsService.onSave(input).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    this.dialogRef.close(true);
                }
            });
        }
    }

    onCancelar(): void {
        this.dialogRef.close();
    }
}
