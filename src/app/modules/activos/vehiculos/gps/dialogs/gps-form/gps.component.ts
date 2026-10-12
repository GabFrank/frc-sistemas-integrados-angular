import { Component, Inject, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Gps } from '../../models/gps.model';
import { GpsService } from '../../service/gps.service';
import { Vehiculo } from '../../../vehiculo/models/vehiculo.model';
import { GpsDialogService } from '../../service/gps-dialog-service.service';
import { finalize, take } from 'rxjs/operators';
import { PROPAGAR_ERROR_DE_RED } from '../../../../../../generics/generic-crud.service';
import { esRechazoDelServidor } from '../../../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../../../shared/services/timeout-link';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';

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
    private notificacionService = inject(NotificacionSnackbarService);

    form: FormGroup;
    gps: Gps;
    vehiculoSelected: Vehiculo | null = null;
    vehiculoDescripcion: string = 'SELECCIONE UN VEHICULO';
    imeiRequeridoInvalido = false;
    guardando = false;
    /** Un alta quedó sin respuesta: pudo haberse guardado, así que al cerrar se refresca la lista. */
    altaSinConfirmar = false;

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
        this.actualizarImeiRequeridoInvalido();
        this.imeiControl.statusChanges.pipe(untilDestroyed(this)).subscribe(() => {
            this.actualizarImeiRequeridoInvalido();
            this.cdr.markForCheck();
        });

        if (this.gps?.id) {
            this.cargarDatos();
        }
    }

    private actualizarImeiRequeridoInvalido(): void {
        this.imeiRequeridoInvalido = this.imeiControl.hasError('required');
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
        if (this.form.invalid || this.guardando) return;
        const input = this.form.getRawValue();
        const esAlta = !input.id;
        this.guardando = true;
        this.gpsService.onSave(input, PROPAGAR_ERROR_DE_RED).pipe(
            take(1),
            finalize(() => {
                this.guardando = false;
                this.cdr.markForCheck();
            })
        ).subscribe({
            next: res => {
                if (res) this.dialogRef.close(true);
            },
            error: error => {
                // Rechazo: el servicio genérico ya mostró el motivo y no se guardó nada. Por un IMEI repetido el
                // central devuelve el texto técnico de la base, así que se agrega uno legible.
                if (esRechazoDelServidor(error)) {
                    if (error.some(e => /constraint/i.test(e?.message || ''))) {
                        this.notificacionService.openWarn('El servidor rechazó el guardado por una restricción de la base: revisá que el IMEI no esté ya registrado', 6);
                    }
                    return;
                }
                if (esAlta) this.altaSinConfirmar = true;
                // El corte del link y la respuesta vacía ya avisaron por su cuenta.
                if (esTimeoutDeLink(error) || Array.isArray(error)) return;
                // El IMEI es único en la base: repetir un alta no duplica el GPS.
                this.notificacionService.openWarn(esAlta
                    ? 'No se pudo confirmar si el GPS se guardó. Si al reintentar el servidor lo rechaza por IMEI repetido, ya estaba guardado'
                    : 'No se pudo confirmar si se guardó. Probá de nuevo', 8);
            }
        });
    }

    onCancelar(): void {
        // Un valor al cerrar hace que la lista se refresque (`GpsDialogService.abrirFormulario`).
        this.dialogRef.close(this.altaSinConfirmar ? 'sin-confirmar' : undefined);
    }
}
