import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { GpsService } from '../../service/gps.service';
import { VehiculoSearchPageGQL } from '../../../vehiculo/graphql/vehiculoSearchPage';
import { Gps } from '../../models/gps.model';
import { Vehiculo } from '../../../vehiculo/models/vehiculo.model';
import { GpsInput } from '../../models/gps-input.model';

@UntilDestroy()
@Component({
    selector: 'app-gps',
    templateUrl: './gps.component.html',
    styleUrls: ['./gps.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GpsComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly gpsService = inject(GpsService);
    private readonly matDialog = inject(MatDialog);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly vehiculoSearchPageGQL = inject(VehiculoSearchPageGQL);
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
        const tableData: TableData[] = [
            { id: 'id', nombre: 'Id' },
            { id: 'chapa', nombre: 'Chapa' },
            { id: 'modelo.marca.descripcion', nombre: 'Marca' },
            { id: 'modelo.descripcion', nombre: 'Modelo' }
        ];

        const searchData: SearchListtDialogData = {
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
            data: searchData,
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

