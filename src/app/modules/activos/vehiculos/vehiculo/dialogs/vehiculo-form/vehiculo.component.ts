import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehiculoService } from '../../service/vehiculo.service';
import { VehiculoDialogService } from '../../service/vehiculo-dialog-service.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Modelo } from '../../models/modelo.model';
import { TipoVehiculo } from '../../models/tipo-vehiculo.model';
import { Persona } from '../../../../../personas/persona/persona.model';
import { BehaviorSubject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Inject, Optional } from '@angular/core';
import { TabService } from '../../../../../../layouts/tab/tab.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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
    private vehiculoDialogService = inject(VehiculoDialogService);
    private tabService = inject(TabService);
    private cdr = inject(ChangeDetectorRef);

    constructor(
        @Optional() public dialogRef: MatDialogRef<VehiculoComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: Vehiculo
    ) { }

    form: FormGroup;
    vehiculo: Vehiculo;

    modelos$ = new BehaviorSubject<Modelo[]>([]);
    tiposVehiculo$ = new BehaviorSubject<TipoVehiculo[]>([]);
    modeloSelected: Modelo;
    tipoVehiculoSelected: TipoVehiculo;
    propietarioSelected: Persona;
    modeloDescripcion: string = 'SELECCIONE UN MODELO';
    tipoVehiculoDescripcion: string = 'SELECCIONE UN TIPO';
    propietarioDescripcion: string = 'SELECCIONE UN PROPIETARIO';
    proveedorSelected: Persona;
    proveedorDescripcion: string = 'SELECCIONE UN PROVEEDOR';
    monedaSelected: any;
    monedaDescripcion: string = 'SELECCIONE UNA MONEDA';

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
        this.inicializarFormulario();
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
            tipoVehiculoId: [null, [Validators.required]],
            propietarioId: [null],
            identificadorInterno: [''],
            tipoCombustibleId: [null],
            chasis: [''],
            aireAcondicionado: [false],
            valorEstimado: [0],
            mantenimientoMotorIntervalo: [null],
            mantenimientoCajaIntervalo: [null],
            situacionPago: ['PAGADO'],
            proveedorId: [null],
            monedaId: [null],
            montoTotal: [0],
            montoYaPagado: [0],
            cantidadCuotas: [1],
            cantidadCuotasPagadas: [0],
            diaVencimiento: [1]
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
            tipoVehiculoId: this.vehiculo?.tipoVehiculo?.id,
            propietarioId: (this.vehiculo as any)?.propietario?.id,
            identificadorInterno: (this.vehiculo as any)?.identificadorInterno || '',
            tipoCombustibleId: (this.vehiculo as any)?.tipoCombustible?.id,
            chasis: (this.vehiculo as any)?.chasis || '',
            aireAcondicionado: (this.vehiculo as any)?.aireAcondicionado || false,
            valorEstimado: (this.vehiculo as any)?.valorEstimado || 0,
            mantenimientoMotorIntervalo: (this.vehiculo as any)?.mantenimientoMotorIntervalo,
            mantenimientoCajaIntervalo: (this.vehiculo as any)?.mantenimientoCajaIntervalo,
            situacionPago: (this.vehiculo as any)?.situacionPago || 'PAGADO',
            proveedorId: (this.vehiculo as any)?.proveedor?.id,
            monedaId: (this.vehiculo as any)?.moneda?.id,
            montoTotal: (this.vehiculo as any)?.montoTotal || 0,
            montoYaPagado: (this.vehiculo as any)?.montoYaPagado || 0,
            cantidadCuotas: (this.vehiculo as any)?.cantidadCuotas || 1,
            cantidadCuotasPagadas: (this.vehiculo as any)?.cantidadCuotasPagadas || 0,
            diaVencimiento: (this.vehiculo as any)?.diaVencimiento || 1
        });

        if ((this.vehiculo as any)?.propietario) {
            this.propietarioSelected = (this.vehiculo as any).propietario;
            this.propietarioDescripcion = `${this.propietarioSelected.nombre}`.toUpperCase();
        }
        if ((this.vehiculo as any)?.proveedor) {
            this.proveedorSelected = (this.vehiculo as any).proveedor;
            this.proveedorDescripcion = `${this.proveedorSelected.nombre}`.toUpperCase();
        }
        if ((this.vehiculo as any)?.moneda) {
            this.monedaSelected = (this.vehiculo as any).moneda;
            this.monedaDescripcion = (this.monedaSelected.denominacion || this.monedaSelected.simbolo)?.toUpperCase();
        }

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
        this.vehiculoDialogService.onGuardar(this.form, this.vehiculo, this.dialogRef);
    }

    onBuscarModelo(): void {
        this.vehiculoDialogService.onBuscarModelo((modelo: Modelo) => {
            this.modeloSelected = modelo;
            this.form.get('modeloId')?.setValue(Number(modelo.id));
            this.actualizarDescripciones();
            this.cdr.markForCheck();
        });
    }

    onBuscarTipoVehiculo(): void {
        this.vehiculoDialogService.onBuscarTipoVehiculo((tipo: TipoVehiculo) => {
            this.tipoVehiculoSelected = tipo;
            this.form.get('tipoVehiculoId')?.setValue(Number(tipo.id));
            this.actualizarDescripciones();
            this.cdr.markForCheck();
        });
    }

    onBuscarPropietario(): void {
        this.vehiculoDialogService.onBuscarPropietario((persona: Persona) => {
            this.propietarioSelected = persona;
            this.propietarioDescripcion = `${persona.nombre}`.toUpperCase();
            this.form.get('propietarioId')?.setValue(Number(persona.id));
            this.cdr.markForCheck();
        });
    }

    onBuscarProveedor(): void {
        this.vehiculoDialogService.onBuscarProveedor((persona: Persona) => {
            this.proveedorSelected = persona;
            this.proveedorDescripcion = `${persona.nombre}`.toUpperCase();
            this.form.get('proveedorId')?.setValue(Number(persona.id));
            this.cdr.markForCheck();
        });
    }

    onBuscarMoneda(): void {
        this.vehiculoDialogService.onBuscarMoneda((moneda: any) => {
            this.monedaSelected = moneda;
            this.monedaDescripcion = (moneda.denominacion || moneda.simbolo)?.toUpperCase();
            this.form.get('monedaId')?.setValue(Number(moneda.id));
            this.cdr.markForCheck();
        });
    }

    onSelectModelo(modelo: Modelo): void {
        this.form.get('modeloId')?.setValue(modelo?.id ? Number(modelo.id) : null);
    }

    onCancelar(): void {
        this.vehiculoDialogService.onCancelar(this.dialogRef);
    }
}
