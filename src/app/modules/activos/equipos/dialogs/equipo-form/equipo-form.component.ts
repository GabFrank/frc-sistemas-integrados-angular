import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { shareReplay, startWith } from 'rxjs/operators';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { Persona } from '../../../../personas/persona/persona.model';
import { Proveedor } from '../../../../personas/proveedor/proveedor.model';
import { Equipo } from '../../models/equipo.model';
import { TipoEquipo } from '../../models/tipo-equipo.model';
import { ModeloEquipo } from '../../models/modelo-equipo.model';
import { EquipoDialogService } from '../../services/equipo-dialog.service';
import { EquiposService } from '../../services/equipos.service';
import { EnteService } from '../../../ente/service/ente.service';
import { TipoEnte } from '../../../ente/enums/tipo-ente.enum';
import { CuotaDetalle } from '../../../shared/models/cuota-detalle.model';
import { CONSULTA_BIEN, EstadoFormularioBien, LECTURA_BIEN } from '../../../shared/forms/estado-formulario-bien';
import { ARCHIVOS_MUEBLE_EQUIPO } from '../../../shared/constants/archivo-tipos.constants';

@UntilDestroy()
@Component({
  selector: 'app-equipo-form',
  templateUrl: './equipo-form.component.html',
  styleUrls: ['./equipo-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private equiposService = inject(EquiposService);
  private equipoDialogService = inject(EquipoDialogService);
  private cdr = inject(ChangeDetectorRef);
  private enteService = inject(EnteService);

  enteId: number | null = null;
  cuotasDetalle: CuotaDetalle[] = [];
  archivosTipos = ARCHIVOS_MUEBLE_EQUIPO;
  registroGuardado = false;

  form: FormGroup;
  equipo: Equipo;

  situacionPagoControl = this.fb.control('PAGADO');
  situacionPago$ = this.situacionPagoControl.valueChanges.pipe(
    startWith(this.situacionPagoControl.value),
    shareReplay(1)
  );

  consumeEnergiaControl = this.fb.control(false);
  consumeEnergia$ = this.consumeEnergiaControl.valueChanges.pipe(
    startWith(this.consumeEnergiaControl.value)
  );

  propietarioSelected: Persona;
  tipoEquipoSelected: TipoEquipo;
  modeloSelected: ModeloEquipo;
  proveedorSelected: Proveedor | Persona;
  monedaSelected: { id?: number; denominacion?: string; simbolo?: string };

  propietarioDescripcion = 'SELECCIONE UN PROPIETARIO';
  modeloDescripcion = 'SELECCIONE UN MODELO';
  tipoEquipoDescripcion = 'SELECCIONE UN TIPO';
  proveedorDescripcion = 'SELECCIONE UN PROVEEDOR';
  monedaDescripcion = 'SELECCIONE UNA MONEDA';

  situacionesPago = ['PAGADO', 'PAGANDO', 'DADO', 'GANADO', 'COMODATO'];
  currencyMask = new CurrencyMask();

  constructor(
    public dialogRef: MatDialogRef<EquipoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Equipo
  ) { }

  ngOnInit(): void {
    this.equipo = this.data;
    this.inicializarFormulario();

    this.situacionPagoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.estado.recalcular());
    if (this.equipo?.id) {
      this.registroGuardado = true;
      this.cargarBien();
    } else {
      this.cargarDatos();
    }
  }

  /**
   * Estado de carga y regla de guardado (#390): no se guarda un bien que no cargó (crearía otro) ni un bien en
   * «pagando» con sus cuotas sin leer (el central regeneraría o borraría el plan).
   */
  estado = new EstadoFormularioBien(() => this.form, () => this.situacionPagoControl.value, () => this.cdr.markForCheck());

  /** También es el «Reintentar» del cartel. */
  cargarBien(): void {
    const id = this.equipo?.id;
    if (!id) return;
    this.estado.actualizar({ bien: 'cargando' });
    this.equiposService.onBuscarPorId(id, LECTURA_BIEN, CONSULTA_BIEN).pipe(untilDestroyed(this)).subscribe({
      error: () => this.estado.actualizar({ bien: 'error' }),
      next: (res) => {
        if (!res) {
          this.estado.actualizar({ bien: 'error' });
          return;
        }
        this.equipo = res;
        this.cargarDatos();
        const eraPagando = this.situacionPagoControl.value === 'PAGANDO';
        // En el mismo paso: nunca queda «pagando» con las cuotas sin pedir y Guardar habilitado
        this.estado.actualizar({ bien: 'ok', eraPagando, cuotas: eraPagando ? 'cargando' : 'sin-cargar' });
        this.cargarEnteYCuotas();
      },
    });
  }

  /** Ente (para los archivos) y, si el bien está en «pagando», sus cuotas guardadas. También es «Reintentar». */
  cargarEnteYCuotas(): void {
    const id = this.equipo?.id;
    if (!id) return;
    const conCuotas = this.estado.eraPagando;
    const lectura = ++this.estado.lectura;
    this.estado.actualizar({ cuotas: conCuotas ? 'cargando' : 'sin-cargar', enteFallo: false });
    this.enteService.cargarEnteYCuotas(TipoEnte.EQUIPO, id, conCuotas).pipe(untilDestroyed(this)).subscribe({
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

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      id: [null],
      propietarioId: [null, Validators.required],
      identificador: ['', Validators.required],
      modeloId: [null],
      descripcion: ['', Validators.required],
      tipoEquipoId: [null, Validators.required],
      consumeEnergia: this.consumeEnergiaControl,
      consumoValor: [''],
      costo: [0],
      valorTasacion: [0],
      valorTasacionPyg: [0],
      valorTasacionBrl: [0],
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

  private cargarDatos(): void {
    if (!this.equipo) {
      this.cdr.markForCheck();
      return;
    }

    const fin = this.equipo.financiero;

    this.form.patchValue({
      id: this.equipo.id,
      propietarioId: this.equipo.propietario?.id,
      identificador: this.equipo.identificador,
      modeloId: this.equipo.modelo?.id,
      descripcion: this.equipo.descripcion,
      tipoEquipoId: this.equipo.tipoEquipo?.id,
      consumeEnergia: this.equipo.consumeEnergia,
      consumoValor: this.equipo.consumoValor,
      costo: fin?.costo || 0,
      valorTasacion: fin?.valorTasacion || 0,
      valorTasacionPyg: fin?.valorTasacionPyg || 0,
      valorTasacionBrl: fin?.valorTasacionBrl || 0,
      situacionPago: fin?.situacionPago || 'PAGADO',
      proveedorId: fin?.proveedor?.id,
      monedaId: fin?.moneda?.id,
      montoTotal: fin?.montoTotal || 0,
      montoYaPagado: fin?.montoYaPagado || 0,
      cantidadCuotas: fin?.cantidadCuotas || 1,
      cantidadCuotasPagadas: fin?.cantidadCuotasPagadas || 0,
      diaVencimiento: fin?.diaVencimiento || 1
    });

    if (this.equipo.propietario) {
      this.propietarioSelected = this.equipo.propietario;
      this.propietarioDescripcion = `${this.equipo.propietario.nombre}`.toUpperCase();
    }
    if (this.equipo.modelo) {
      this.modeloSelected = this.equipo.modelo;
      this.modeloDescripcion = `${this.equipo.modelo.descripcion} (${this.equipo.modelo.marca?.descripcion})`.toUpperCase();
    }
    if (this.equipo.tipoEquipo) {
      this.tipoEquipoSelected = this.equipo.tipoEquipo;
      this.tipoEquipoDescripcion = this.equipo.tipoEquipo.descripcion?.toUpperCase() || '';
    }
    if (fin?.proveedor) {
      this.proveedorSelected = fin.proveedor;
      this.proveedorDescripcion = this.nombreProveedor(fin.proveedor);
    }
    if (fin?.moneda) {
      this.monedaSelected = fin.moneda;
      this.monedaDescripcion = fin.moneda.denominacion?.toUpperCase() || '';
    }

    this.cdr.markForCheck();
  }

  onBuscarPropietario(): void {
    this.equipoDialogService.onBuscarPropietario((persona: Persona) => {
      this.propietarioSelected = persona;
      this.propietarioDescripcion = persona.nombre?.toUpperCase() || '';
      this.form.controls['propietarioId'].setValue(Number(persona.id));
      this.cdr.markForCheck();
    });
  }

  onBuscarModelo(): void {
    this.equipoDialogService.onBuscarModelo((modelo: ModeloEquipo) => {
      this.modeloSelected = modelo;
      this.modeloDescripcion = `${modelo.descripcion} (${modelo.marca?.descripcion})`.toUpperCase();
      this.form.controls['modeloId'].setValue(Number(modelo.id));
      this.cdr.markForCheck();
    });
  }

  onBuscarTipoEquipo(): void {
    this.equipoDialogService.onBuscarTipoEquipo((tipo: TipoEquipo) => {
      this.tipoEquipoSelected = tipo;
      this.tipoEquipoDescripcion = tipo.descripcion?.toUpperCase() || '';
      this.form.controls['tipoEquipoId'].setValue(tipo.id);
      this.cdr.markForCheck();
    });
  }

  onBuscarProveedor(): void {
    this.equipoDialogService.onBuscarProveedor((proveedor: Proveedor) => {
      this.proveedorSelected = proveedor;
      this.proveedorDescripcion = this.nombreProveedor(proveedor);
      this.form.controls['proveedorId'].setValue(Number(proveedor.id));
      this.cdr.markForCheck();
    });
  }

  onBuscarMoneda(): void {
    this.equipoDialogService.onBuscarMoneda((moneda) => {
      this.monedaSelected = moneda;
      this.monedaDescripcion = (moneda.denominacion || moneda.simbolo)?.toUpperCase() || '';
      this.form.controls['monedaId'].setValue(moneda.id);
      this.cdr.markForCheck();
    });
  }

  onCancelar(): void {
    this.equipoDialogService.onCancelar(this.dialogRef);
  }

  onGuardar(): void {
    if (this.estado.guardarBloqueado) return;
    const situacionEnviada = this.situacionPagoControl.value;
    const cerrar = !!this.equipo?.id && this.registroGuardado;
    this.equipoDialogService.onGuardar(this.form, this.equipo, this.dialogRef, this.cuotasDetalle, cerrar)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!res?.id) return;
        this.equipo = { ...this.equipo, ...res, id: res.id };
        this.registroGuardado = true;
        this.form.patchValue({ id: res.id });
        // En una edición el diálogo ya se cerró: no hay nada que recargar
        if (cerrar) return;
        // Recién guardado: su situación guardada es la que se envió
        const eraPagando = situacionEnviada === 'PAGANDO';
        this.estado.actualizar({ bien: 'ok', eraPagando, cuotas: eraPagando ? 'cargando' : 'sin-cargar' });
        this.cargarEnteYCuotas();
        this.cdr.markForCheck();
      });
  }

  private nombreProveedor(proveedor: Proveedor | Persona): string {
    const nombre = (proveedor as Proveedor)?.persona?.nombre ?? (proveedor as Persona)?.nombre;
    return nombre?.toUpperCase() || 'SELECCIONE UN PROVEEDOR';
  }
}
