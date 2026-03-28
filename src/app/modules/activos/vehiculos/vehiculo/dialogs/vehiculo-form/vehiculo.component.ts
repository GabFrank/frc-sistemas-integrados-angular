import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehiculoService } from '../../service/vehiculo.service';
import { VehiculoInput } from '../../models/vehiculo-input.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Vehiculo } from '../../models/vehiculo.model';
import { Modelo } from '../../models/modelo.model';
import { TipoVehiculo } from '../../models/tipo-vehiculo.model';
import { Persona } from '../../../../../personas/persona/persona.model';
import { BehaviorSubject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Inject, Optional } from '@angular/core';
import { TabService } from '../../../../../../layouts/tab/tab.service';
import { MainService } from '../../../../../../main.service';
import { dateToString } from '../../../../../../commons/core/utils/dateUtils';

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
            tipoVehiculoId: [null, [Validators.required]],
            // Nuevos campos Etapa 1
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
            // Nuevos campos
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
                proveedorId: values.proveedorId ? Number(values.proveedorId) : undefined,
                monedaId: values.monedaId ? Number(values.monedaId) : undefined,
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
        this.vehiculoService.abrirBuscadorModelo(true).pipe(untilDestroyed(this)).subscribe(res => {
            if (res) {
                if (res.adicionar) {
                    this.vehiculoService.abrirAdicionarModelo().pipe(untilDestroyed(this)).subscribe(nuevoModelo => {
                        if (nuevoModelo) {
                            this.modeloSelected = nuevoModelo;
                            this.form.get('modeloId')?.setValue(Number(nuevoModelo.id));
                            this.actualizarDescripciones();
                            this.cdr.markForCheck();
                        }
                    });
                } else {
                    const id = Number(res.id);
                    this.modeloSelected = res;
                    this.form.get('modeloId')?.setValue(id);
                    this.actualizarDescripciones();
                    this.cdr.markForCheck();
                }
            }
        });
    }

    onBuscarTipoVehiculo(): void {
        this.vehiculoService.abrirBuscadorTipoVehiculo(true).pipe(untilDestroyed(this)).subscribe(res => {
            if (res) {
                if (res.adicionar) {
                    this.vehiculoService.abrirAdicionarTipoVehiculo().pipe(untilDestroyed(this)).subscribe(nuevoTipo => {
                        if (nuevoTipo) {
                            this.tipoVehiculoSelected = nuevoTipo;
                            this.form.get('tipoVehiculoId')?.setValue(Number(nuevoTipo.id));
                            this.actualizarDescripciones();
                            this.cdr.markForCheck();
                        }
                    });
                } else {
                    const id = Number(res.id);
                    this.tipoVehiculoSelected = res;
                    this.form.get('tipoVehiculoId')?.setValue(id);
                    this.actualizarDescripciones();
                    this.cdr.markForCheck();
                }
            }
        });
    }

    onBuscarPropietario(): void {
        this.vehiculoService.abrirBuscadorPropietario().pipe(untilDestroyed(this)).subscribe(res => {
            if (res) {
                if (res.adicionar) {
                    this.vehiculoService.abrirAdicionarPersona().pipe(untilDestroyed(this)).subscribe(nuevaPersona => {
                        if (nuevaPersona) {
                            this.propietarioSelected = nuevaPersona;
                            this.propietarioDescripcion = `${nuevaPersona.nombre}`.toUpperCase();
                            this.form.get('propietarioId')?.setValue(Number(nuevaPersona.id));
                            this.cdr.markForCheck();
                        }
                    });
                } else {
                    this.propietarioSelected = res;
                    this.propietarioDescripcion = `${res.nombre}`.toUpperCase();
                    this.form.get('propietarioId')?.setValue(Number(res.id));
                    this.cdr.markForCheck();
                }
            }
        });
    }

    onBuscarProveedor(): void {
        this.vehiculoService.abrirBuscadorPropietario().pipe(untilDestroyed(this)).subscribe(res => {
            if (res) {
                if (res.adicionar) {
                    this.vehiculoService.abrirAdicionarPersona().pipe(untilDestroyed(this)).subscribe(nuevaPersona => {
                        if (nuevaPersona) {
                            this.proveedorSelected = nuevaPersona;
                            this.proveedorDescripcion = `${nuevaPersona.nombre}`.toUpperCase();
                            this.form.get('proveedorId')?.setValue(Number(nuevaPersona.id));
                            this.cdr.markForCheck();
                        }
                    });
                } else {
                    this.proveedorSelected = res;
                    this.proveedorDescripcion = `${res.nombre}`.toUpperCase();
                    this.form.get('proveedorId')?.setValue(Number(res.id));
                    this.cdr.markForCheck();
                }
            }
        });
    }

    onBuscarMoneda(): void {
        this.vehiculoService.abrirBuscadorMoneda().pipe(untilDestroyed(this)).subscribe(res => {
            if (res) {
                this.monedaSelected = res;
                this.monedaDescripcion = (res.denominacion || res.simbolo)?.toUpperCase();
                this.form.get('monedaId')?.setValue(Number(res.id));
                this.cdr.markForCheck();
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
