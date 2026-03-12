import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, Optional, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GpsService } from '../gps.service';
import { Gps } from '../models/gps.model';
import { GpsInput } from '../models/gps-input.model';
import { Vehiculo } from '../models/vehiculo.model';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { VehiculoSearchPageGQL } from '../graphql/vehiculoSearchPage';

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
    private vehiculoSearchPageGQL = inject(VehiculoSearchPageGQL);

    constructor(
        @Optional() public dialogRef: MatDialogRef<GpsComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: Gps
    ) { }

    form: FormGroup;
    gps: Gps;
    vehiculoSelected: Vehiculo | null = null;
    vehiculoDescripcion: string = 'SELECCIONE UN VEHICULO';

    private actualizarVehiculoDescripcion(): void {
        if (this.vehiculoSelected) {
            this.vehiculoDescripcion = `${this.vehiculoSelected.chapa} - ${this.vehiculoSelected.modelo?.descripcion || ''}`.toUpperCase();
        } else {
            this.vehiculoDescripcion = 'SELECCIONE UN VEHICULO';
        }
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
            this.actualizarVehiculoDescripcion();
        }
        this.cdr.markForCheck();
    }

    onBuscarVehiculo(): void {
        const tableData: TableData[] = [
            { id: 'id', nombre: 'Id' },
            { id: 'chapa', nombre: 'Chapa' },
            { id: 'modelo.marca.descripcion', nombre: 'Marca' },
            { id: 'modelo.descripcion', nombre: 'Modelo' }
        ];

        const data: SearchListtDialogData = {
            query: this.vehiculoSearchPageGQL,
            tableData,
            titulo: 'Buscar Vehículo',
            search: true,
            inicialSearch: true,
            textHint: 'Buscar por chapa, marca o modelo...',
            paginator: true,
            queryData: { page: 0, size: 15 }
        };

        this.matDialog.open(SearchListDialogComponent, {
            data,
            width: '70%',
            height: '80%'
        }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: Vehiculo) => {
            if (res) {
                this.vehiculoSelected = res;
                this.form.get('vehiculoId')?.setValue(res.id);
                this.actualizarVehiculoDescripcion();
                this.cdr.markForCheck();
            }
        });
    }

    onLimpiarVehiculo(event: Event): void {
        event.stopPropagation();
        this.vehiculoSelected = null;
        this.form.get('vehiculoId')?.setValue(null);
        this.actualizarVehiculoDescripcion();
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
