import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyMask } from '../../../../../../commons/core/utils/numbersUtils';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehiculoService } from '../../service/vehiculo.service';
import { VehiculoDialogService } from '../../service/vehiculo-dialog-service.service';
import { Vehiculo } from '../../models/vehiculo.model';
import { Modelo } from '../../models/modelo.model';
import { TipoVehiculo } from '../../models/tipo-vehiculo.model';
import { Persona } from '../../../../../personas/persona/persona.model';
import { Proveedor } from '../../../../../personas/proveedor/proveedor.model';
import { BehaviorSubject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Inject, Optional } from '@angular/core';
import { TabService } from '../../../../../../layouts/tab/tab.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { finalize, startWith } from 'rxjs/operators';
import { EnteService } from '../../../../ente/service/ente.service';
import { TipoEnte } from '../../../../ente/enums/tipo-ente.enum';
import { CuotaDetalle } from '../../../../shared/models/cuota-detalle.model';
import { CONSULTA_BIEN, EstadoFormularioBien, LECTURA_BIEN } from '../../../../shared/forms/estado-formulario-bien';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { ARCHIVOS_VEHICULO } from '../../../../shared/constants/archivo-tipos.constants';

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
    private notificacionService = inject(NotificacionSnackbarService);
    private enteService = inject(EnteService);

    enteId: number | null = null;
    cuotasDetalle: CuotaDetalle[] = [];
    archivosTipos = ARCHIVOS_VEHICULO;
    registroGuardado = false;
    nuevoControl = this.fb.control(false);
    nuevo$ = this.nuevoControl.valueChanges.pipe(startWith(this.nuevoControl.value));

    constructor(
        @Optional() public dialogRef: MatDialogRef<VehiculoComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data: Vehiculo
    ) { }

    form: FormGroup;
    vehiculo: Vehiculo;

    situacionPagoControl = this.fb.control('PAGADO');
    situacionPago$ = this.situacionPagoControl.valueChanges.pipe(
        startWith(this.situacionPagoControl.value)
    );

    modelos$ = new BehaviorSubject<Modelo[]>([]);
    tiposVehiculo$ = new BehaviorSubject<TipoVehiculo[]>([]);
    modeloSelected: Modelo;
    tipoVehiculoSelected: TipoVehiculo;
    propietarioSelected: Persona;
    modeloDescripcion: string = 'SELECCIONE UN MODELO';
    tipoVehiculoDescripcion: string = 'SELECCIONE UN TIPO';
    propietarioDescripcion: string = 'SELECCIONE UN PROPIETARIO';
    proveedorSelected: Proveedor | Persona;
    proveedorDescripcion: string = 'SELECCIONE UN PROVEEDOR';
    monedaSelected: any;
    monedaDescripcion: string = 'SELECCIONE UNA MONEDA';
    currencyMask = new CurrencyMask();

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
        this.situacionPagoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.estado.recalcular());
        if (this.vehiculo?.id) {
            this.registroGuardado = true;
            this.cargarBien();
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
            nuevo: this.nuevoControl,
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
            valorEstimadoPyg: [0],
            valorEstimadoBrl: [0],
            mantenimientoMotorIntervalo: [null],
            mantenimientoCajaIntervalo: [null],
            situacionPago: this.situacionPagoControl,
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
            valorEstimadoPyg: (this.vehiculo as any)?.valorEstimadoPyg || 0,
            valorEstimadoBrl: (this.vehiculo as any)?.valorEstimadoBrl || 0,
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
            this.proveedorDescripcion = this.getProveedorNombre(this.proveedorSelected);
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

    /**
     * Estado de carga y regla de guardado (#390): no se guarda un bien que no cargó (crearía otro) ni un bien en
     * «pagando» con sus cuotas sin leer (el central regeneraría o borraría el plan).
     */
    estado = new EstadoFormularioBien(() => this.form, () => this.situacionPagoControl.value, () => this.cdr.markForCheck());

    /** También es el «Reintentar» del cartel. */
    cargarBien(): void {
        const id = this.vehiculo?.id;
        if (!id) return;
        this.estado.actualizar({ bien: 'cargando' });
        this.vehiculoService.onBuscarPorId(id, LECTURA_BIEN, CONSULTA_BIEN).pipe(untilDestroyed(this)).subscribe({
            error: () => this.estado.actualizar({ bien: 'error' }),
            next: (res) => {
                if (!res) {
                    this.estado.actualizar({ bien: 'error' });
                    return;
                }
                this.vehiculo = res;
                this.cargarDatosEnFormulario();
                const eraPagando = this.situacionPagoControl.value === 'PAGANDO';
                // En el mismo paso: nunca queda «pagando» con las cuotas sin pedir y Guardar habilitado
                this.estado.actualizar({ bien: 'ok', eraPagando, cuotas: eraPagando ? 'cargando' : 'sin-cargar' });
                this.cargarEnteYCuotas();
            },
        });
    }

    /** Ente (para los archivos) y, si el bien está en «pagando», sus cuotas guardadas. También es «Reintentar». */
    cargarEnteYCuotas(): void {
        const id = this.vehiculo?.id;
        if (!id) return;
        const conCuotas = this.estado.eraPagando;
        const lectura = ++this.estado.lectura;
        this.estado.actualizar({ cuotas: conCuotas ? 'cargando' : 'sin-cargar', enteFallo: false });
        this.enteService.cargarEnteYCuotas(TipoEnte.VEHICULO, id, conCuotas).pipe(untilDestroyed(this)).subscribe({
            error: () => {
                if (lectura === this.estado.lectura) this.estado.actualizar({ cuotas: 'error' });
            },
            next: (resultado) => {
                if (lectura !== this.estado.lectura) return; // hay una lectura más nueva
                this.enteId = resultado.enteId;
                // Las cuotas guardadas reemplazan siempre a las que hubiera (también una lista vacía)
                if (resultado.cuotas != null) this.cuotasDetalle = resultado.cuotas;
                this.estado.actualizar({ cuotas: conCuotas ? 'ok' : 'sin-cargar', enteFallo: resultado.enteFallo });
            },
        });
    }

    onPlanSinCalcular(sinCalcular: boolean): void {
        this.estado.actualizar({ planSinCalcular: sinCalcular });
    }

    onCuotasChange(cuotas: CuotaDetalle[]): void {
        this.cuotasDetalle = cuotas;
    }

    onMontoTotalCuotasChange(montoTotal: number): void {
        this.form.patchValue({ montoTotal }, { emitEvent: false });
        this.cdr.markForCheck();
    }

    onGuardar(): void {
        if (this.estado.guardarBloqueado) return;
        const situacionEnviada = this.situacionPagoControl.value;
        // «Alta» es lo que ve el servidor: se envía sin id (se calcula antes de enviar)
        const esAlta = !this.form.getRawValue().id;
        const chapaCargada = !!this.form.getRawValue().chapa?.trim();
        const cerrar = !!this.vehiculo?.id && this.registroGuardado;
        this.estado.actualizar({ guardando: true });
        this.vehiculoDialogService.onGuardar(this.form, this.vehiculo, this.dialogRef, this.cuotasDetalle, cerrar)
            // Se libera también en `next`: el genérico puede emitir sin completar
            .pipe(untilDestroyed(this), finalize(() => this.estado.actualizar({ guardando: false })))
            .subscribe({ error: (error) => {
                const aviso = this.estado.alFallarElGuardado(error, esAlta, chapaCargada);
                if (aviso) this.notificacionService.openWarn(aviso, 10);
            }, next: (res) => {
                this.estado.actualizar({ guardando: false });
                if (!res?.id) return;
                this.vehiculo = { ...this.vehiculo, ...res, id: res.id };
                this.registroGuardado = true;
                this.form.patchValue({ id: res.id });
                // En una edición el diálogo ya se cerró: no hay nada que recargar
                if (cerrar) return;
                // Recién guardado: su situación guardada es la que se envió
                const eraPagando = situacionEnviada === 'PAGANDO';
                this.estado.actualizar({ bien: 'ok', eraPagando, cuotas: eraPagando ? 'cargando' : 'sin-cargar' });
                this.cargarEnteYCuotas();
                this.cdr.markForCheck();
            } });
    }

    onBuscarModelo(): void {
        this.vehiculoDialogService.onBuscarModelo((modelo: Modelo) => {
            this.modeloSelected = modelo;
            this.form.controls['modeloId'].setValue(Number(modelo.id));
            this.actualizarDescripciones();
            this.cdr.markForCheck();
        });
    }

    onBuscarTipoVehiculo(): void {
        this.vehiculoDialogService.onBuscarTipoVehiculo((tipo: TipoVehiculo) => {
            this.tipoVehiculoSelected = tipo;
            this.form.controls['tipoVehiculoId'].setValue(Number(tipo.id));
            this.actualizarDescripciones();
            this.cdr.markForCheck();
        });
    }

    onBuscarPropietario(): void {
        this.vehiculoDialogService.onBuscarPropietario((persona: Persona) => {
            this.propietarioSelected = persona;
            this.propietarioDescripcion = `${persona.nombre}`.toUpperCase();
            this.form.controls['propietarioId'].setValue(Number(persona.id));
            this.cdr.markForCheck();
        });
    }

    onBuscarProveedor(): void {
        this.vehiculoDialogService.onBuscarProveedor((proveedor: Proveedor) => {
            this.proveedorSelected = proveedor;
            this.proveedorDescripcion = this.getProveedorNombre(proveedor);
            this.form.controls['proveedorId'].setValue(Number(proveedor.id));
            this.cdr.markForCheck();
        });
    }

    onBuscarMoneda(): void {
        this.vehiculoDialogService.onBuscarMoneda((moneda: any) => {
            this.monedaSelected = moneda;
            this.monedaDescripcion = (moneda.denominacion || moneda.simbolo)?.toUpperCase();
            this.form.controls['monedaId'].setValue(Number(moneda.id));
            this.cdr.markForCheck();
        });
    }

    onSelectModelo(modelo: Modelo): void {
        this.form.controls['modeloId'].setValue(modelo?.id ? Number(modelo.id) : null);
    }

    onCancelar(): void {
        // Con un alta sin confirmar, cerrar refresca la lista: el bien pudo haberse guardado
        this.vehiculoDialogService.onCancelar(this.dialogRef, this.estado.altaSinConfirmar);
    }

    private getProveedorNombre(proveedor: Proveedor | Persona): string {
        const nombre = (proveedor as Proveedor)?.persona?.nombre ?? (proveedor as Persona)?.nombre;
        return nombre ? `${nombre}`.toUpperCase() : 'SELECCIONE UN PROVEEDOR';
    }
}
