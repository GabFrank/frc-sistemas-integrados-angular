import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehiculoService } from '../vehiculo.service';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { VehiculoInput } from '../models/vehiculo-input.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Vehiculo } from '../models/vehiculo.model';
import { Modelo } from '../models/modelo.model';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { BehaviorSubject } from 'rxjs';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Inject, Optional } from '@angular/core';
import { BuscarModeloDialogComponent } from '../buscar-modelo-dialog/buscar-modelo-dialog.component';
import { BuscarTipoVehiculoDialogComponent } from '../buscar-tipo-vehiculo-dialog/buscar-tipo-vehiculo-dialog.component';
import { MainService } from '../../../../main.service';

@UntilDestroy()
@Component({
    selector: 'app-vehiculo',
    templateUrl: './vehiculo.component.html',
    styleUrls: ['./vehiculo.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehiculoComponent implements OnInit {
    private fb = inject(FormBuilder);
    private vehiculoService = inject(VehiculoService);
    private tabService = inject(TabService);
    private matDialog = inject(MatDialog);
    private cdr = inject(ChangeDetectorRef);
    public mainService = inject(MainService);

    constructor(
        @Optional() public dialogRef: MatDialogRef<VehiculoComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    form: FormGroup;
    vehiculo: Vehiculo;

    modelos$ = new BehaviorSubject<Modelo[]>([]);
    tiposVehiculo$ = new BehaviorSubject<TipoVehiculo[]>([]);
    modeloSelected: Modelo;
    tipoVehiculoSelected: TipoVehiculo;
    modeloDescripcion: string = 'SELECCIONE UN MODELO';
    tipoVehiculoDescripcion: string = 'SELECCIONE UN TIPO';

    private actualizarDescripciones(): void {
        if (this.modeloSelected) {
            this.modeloDescripcion = `${this.modeloSelected.descripcion} (${this.modeloSelected.marca?.descripcion})`.toUpperCase();
        } else {
            this.modeloDescripcion = 'SELECCIONE UN MODELO';
        }

        if (this.tipoVehiculoSelected) {
            this.tipoVehiculoDescripcion = `${this.tipoVehiculoSelected.descripcion}`.toUpperCase();
        } else {
            this.tipoVehiculoDescripcion = 'SELECCIONE UN TIPO';
        }
    }

    ngOnInit(): void {
        const tabData = this.tabService.currentTab()?.tabData?.data;
        this.vehiculo = this.data || tabData;

        // Inicializar formulario primero para evitar errores en el template
        this.inicializarFormulario();

        // Si hay un ID, cargar todos los datos completos del vehículo
        if (this.vehiculo?.id) {
            this.vehiculoService.onBuscarPorId(this.vehiculo.id).pipe(untilDestroyed(this)).subscribe(vehiculoCompleto => {
                if (vehiculoCompleto) {
                    this.vehiculo = vehiculoCompleto;
                    this.cargarDatosEnFormulario();
                }
            });
        } else {
            this.cargarDatosEnFormulario();
        }
    }

    private inicializarFormulario(): void {
        this.form = this.fb.group({
            id: [null],
            chapa: [null, [Validators.required]],
            color: [null, [Validators.required]],
            anho: [new Date().getFullYear(), [Validators.required, Validators.min(1900)]],
            nuevo: [false],
            documentacion: [false],
            refrigerado: [false],
            capacidadKg: [null],
            capacidadPasajeros: [null],
            primerKilometraje: [null],
            fechaAdquisicion: [null],
            modeloId: [null, [Validators.required]],
            tipoVehiculoId: [null, [Validators.required]]
        });
    }

    private cargarDatosEnFormulario(): void {
        if (!this.form) {
            this.inicializarFormulario();
        }

        const fechaAdquisicion = this.vehiculo?.fechaAdquisicion
            ? (this.vehiculo.fechaAdquisicion instanceof Date
                ? this.vehiculo.fechaAdquisicion
                : new Date(this.vehiculo.fechaAdquisicion))
            : null;
        const fechaValida = fechaAdquisicion && !isNaN(fechaAdquisicion.getTime()) ? fechaAdquisicion : null;

        this.form.patchValue({
            id: this.vehiculo?.id,
            chapa: this.vehiculo?.chapa,
            color: this.vehiculo?.color,
            anho: this.vehiculo?.anho || new Date().getFullYear(),
            nuevo: this.vehiculo?.nuevo || false,
            documentacion: this.vehiculo?.documentacion || false,
            refrigerado: this.vehiculo?.refrigerado || false,
            capacidadKg: this.vehiculo?.capacidadKg,
            capacidadPasajeros: this.vehiculo?.capacidadPasajeros,
            primerKilometraje: this.vehiculo?.primerKilometraje,
            fechaAdquisicion: fechaValida,
            modeloId: this.vehiculo?.modelo?.id,
            tipoVehiculoId: this.vehiculo?.tipoVehiculo?.id
        });

        if (this.vehiculo?.modelo) {
            this.modeloSelected = this.vehiculo.modelo;
            this.modelos$.next([this.vehiculo.modelo]);
        }
        if (this.vehiculo?.tipoVehiculo) {
            this.tipoVehiculoSelected = this.vehiculo.tipoVehiculo;
            this.tiposVehiculo$.next([this.vehiculo.tipoVehiculo]);
        }
        this.actualizarDescripciones();
        this.cdr.markForCheck();
    }

    onGuardar(): void {
        if (this.form.valid) {
            const values = this.form.getRawValue();
            const modeloId = Number(values.modeloId);
            const tipoVehiculoId = Number(values.tipoVehiculoId);
            const input: VehiculoInput = {
                ...values,
                id: values.id ? Number(values.id) : undefined,
                chapa: values.chapa?.trim()?.toUpperCase(),
                color: values.color?.trim()?.toUpperCase(),
                fechaAdquisicion: values.fechaAdquisicion ? dateToString(new Date(values.fechaAdquisicion), 'yyyy-MM-dd') : null,
                primerKilometraje: values.primerKilometraje || null,
                capacidadKg: values.capacidadKg || null,
                capacidadPasajeros: values.capacidadPasajeros || null,
                modeloId: Number.isFinite(modeloId) ? modeloId : null,
                tipoVehiculoId: Number.isFinite(tipoVehiculoId) ? tipoVehiculoId : null,
                usuarioId: this.mainService.usuarioActual?.id || this.vehiculo?.usuario?.id
            };
            this.vehiculoService.onGuardar(input).pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                    if (this.dialogRef) {
                        this.dialogRef.close(true);
                    } else {
                        this.tabService.removeTab(this.tabService.currentIndex);
                    }
                }
            });
        }
    }

    onBuscarModelo(): void {
        const dialogRef = this.matDialog.open(BuscarModeloDialogComponent, {
            width: '800px',
            disableClose: true,
            autoFocus: false
        });

        dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
            const id = Number(res?.id);
            if (res && Number.isFinite(id)) {
                this.modeloSelected = res;
                this.form.get('modeloId')?.setValue(id);
                this.actualizarDescripciones();
                setTimeout(() => this.cdr.markForCheck(), 0);
            }
        });
    }

    onBuscarTipoVehiculo(): void {
        const dialogRef = this.matDialog.open(BuscarTipoVehiculoDialogComponent, {
            width: '800px',
            disableClose: true,
            autoFocus: false
        });

        dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
            const id = Number(res?.id);
            if (res && Number.isFinite(id)) {
                this.tipoVehiculoSelected = res;
                this.form.get('tipoVehiculoId')?.setValue(id);
                this.actualizarDescripciones();
                setTimeout(() => this.cdr.markForCheck(), 0);
            }
        });
    }

    onSelectModelo(modelo: Modelo): void {
        this.form.get('modeloId')?.setValue(modelo?.id ? Number(modelo.id) : null);
    }

    onCancelar(): void {
        if (this.dialogRef) {
            this.dialogRef.close();
        } else {
            this.tabService.removeTab(this.tabService.currentIndex);
        }
    }
}
