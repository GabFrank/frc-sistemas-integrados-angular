import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MuebleService } from '../../service/mueble.service';
import { MuebleDialogService } from '../../service/mueble-dialog-service.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { shareReplay, startWith } from 'rxjs/operators';
import { Mueble } from '../../models/mueble.model';
import { Persona } from '../../../../personas/persona/persona.model';
import { FamiliaMueble } from '../../models/familia-mueble.model';
import { TipoMueble } from '../../models/tipo-mueble.model';
import { Proveedor } from '../../../../personas/proveedor/proveedor.model';
import { EnteService } from '../../../ente/service/ente.service';
import { TipoEnte } from '../../../ente/enums/tipo-ente.enum';
import { CuotaDetalle } from '../../../shared/models/cuota-detalle.model';
import { CONSULTA_BIEN, EstadoFormularioBien, LECTURA_BIEN } from '../../../shared/forms/estado-formulario-bien';
import { ARCHIVOS_MUEBLE_EQUIPO } from '../../../shared/constants/archivo-tipos.constants';

@UntilDestroy()
@Component({
  selector: 'app-mueble-form',
  templateUrl: './mueble-form.component.html',
  styleUrls: ['./mueble-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MuebleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private muebleService = inject(MuebleService);
  private muebleDialogService = inject(MuebleDialogService);
  private cdr = inject(ChangeDetectorRef);
  private enteService = inject(EnteService);

  enteId: number | null = null;
  cuotasDetalle: CuotaDetalle[] = [];
  archivosTipos = ARCHIVOS_MUEBLE_EQUIPO;
  registroGuardado = false;

  form: FormGroup;
  mueble: Mueble;

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
  familiaSelected: FamiliaMueble;
  tipoMuebleSelected: TipoMueble;

  propietarioDescripcion: string = 'SELECCIONE UN PROPIETARIO';
  familiaDescripcion: string = 'SELECCIONE UNA FAMILIA';
  tipoMuebleDescripcion: string = 'SELECCIONE UN TIPO';

  situacionesPago = ['PAGADO', 'PAGANDO', 'DADO', 'GANADO', 'COMODATO'];
  monedas = ['PYG', 'USD', 'BRL'];
  currencyMask = new CurrencyMask();

  proveedorSelected: Proveedor | Persona;
  proveedorDescripcion: string = 'SELECCIONE UN PROVEEDOR';

  monedaSelected: any;
  monedaDescripcion: string = 'SELECCIONE UNA MONEDA';

  constructor(
    public dialogRef: MatDialogRef<MuebleFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Mueble
  ) { }

  ngOnInit(): void {
    this.mueble = this.data;
    this.inicializarFormulario();

    this.situacionPagoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.estado.recalcular());
    if (this.mueble?.id) {
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
    const id = this.mueble?.id;
    if (!id) return;
    this.estado.actualizar({ bien: 'cargando' });
    this.muebleService.onBuscarPorId(id, LECTURA_BIEN, CONSULTA_BIEN).pipe(untilDestroyed(this)).subscribe({
      error: () => this.estado.actualizar({ bien: 'error' }),
      next: (res) => {
        if (!res) {
          this.estado.actualizar({ bien: 'error' });
          return;
        }
        this.mueble = res;
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
    const id = this.mueble?.id;
    if (!id) return;
    const conCuotas = this.estado.eraPagando;
    const lectura = ++this.estado.lectura;
    this.estado.actualizar({ cuotas: conCuotas ? 'cargando' : 'sin-cargar', enteFallo: false });
    this.enteService.cargarEnteYCuotas(TipoEnte.MUEBLE, id, conCuotas).pipe(untilDestroyed(this)).subscribe({
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
      descripcion: ['', Validators.required],
      familiaId: [null, Validators.required],
      tipoMuebleId: [null, Validators.required],
      consumeEnergia: this.consumeEnergiaControl,
      consumoValor: [''],
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
    if (this.mueble) {
      this.form.patchValue({
        id: this.mueble.id,
        propietarioId: this.mueble.propietario?.id,
        identificador: this.mueble.identificador,
        descripcion: this.mueble.descripcion,
        familiaId: this.mueble.familia?.id,
        tipoMuebleId: this.mueble.tipoMueble?.id,
        consumeEnergia: this.mueble.consumeEnergia,
        consumoValor: this.mueble.consumoValor,
        valorTasacion: this.mueble.valorTasacion,
        valorTasacionPyg: this.mueble.valorTasacionPyg || 0,
        valorTasacionBrl: this.mueble.valorTasacionBrl || 0,
        situacionPago: this.mueble.situacionPago || 'PAGADO',
        proveedorId: this.mueble.proveedor?.id,
        monedaId: this.mueble.moneda?.id,
        montoTotal: this.mueble.montoTotal || 0,
        montoYaPagado: this.mueble.montoYaPagado || 0,
        cantidadCuotas: this.mueble.cantidadCuotas || 1,
        cantidadCuotasPagadas: this.mueble.cantidadCuotasPagadas || 0,
        diaVencimiento: this.mueble.diaVencimiento || 1
      });

      if (this.mueble.propietario) {
        this.propietarioSelected = this.mueble.propietario;
        this.propietarioDescripcion = `${this.mueble.propietario.nombre}`.toUpperCase();
      }
      if (this.mueble.familia) {
        this.familiaSelected = this.mueble.familia;
        this.familiaDescripcion = this.mueble.familia.descripcion?.toUpperCase() || '';
      }
      if (this.mueble.tipoMueble) {
        this.tipoMuebleSelected = this.mueble.tipoMueble;
        this.tipoMuebleDescripcion = this.mueble.tipoMueble.descripcion?.toUpperCase() || '';
      }
      if (this.mueble.proveedor) {
        this.proveedorSelected = this.mueble.proveedor;
        this.proveedorDescripcion = this.getProveedorNombre(this.mueble.proveedor);
      }
      if (this.mueble.moneda) {
        this.monedaSelected = this.mueble.moneda;
        this.monedaDescripcion = this.mueble.moneda.denominacion?.toUpperCase() || '';
      }
    }
    this.cdr.markForCheck();
  }

  onBuscarPropietario(): void {
    this.muebleDialogService.onBuscarPropietario((persona: Persona) => {
      this.propietarioSelected = persona;
      this.propietarioDescripcion = persona.nombre?.toUpperCase() || '';
      this.form.controls['propietarioId'].setValue(Number(persona.id));
      this.cdr.markForCheck();
    });
  }

  onBuscarFamilia(): void {
    this.muebleDialogService.onBuscarFamilia((familia: FamiliaMueble) => {
      this.familiaSelected = familia;
      this.familiaDescripcion = familia.descripcion?.toUpperCase() || '';
      this.form.controls['familiaId'].setValue(familia.id);
      this.cdr.markForCheck();
    });
  }

  onBuscarTipo(): void {
    this.muebleDialogService.onBuscarTipo(this.familiaSelected?.id, (tipo: TipoMueble) => {
      this.tipoMuebleSelected = tipo;
      this.tipoMuebleDescripcion = tipo.descripcion?.toUpperCase() || '';
      this.form.controls['tipoMuebleId'].setValue(tipo.id);
      this.cdr.markForCheck();
    });
  }

  onBuscarProveedor(): void {
    this.muebleDialogService.onBuscarProveedor((proveedor: Proveedor) => {
      this.proveedorSelected = proveedor;
      this.proveedorDescripcion = this.getProveedorNombre(proveedor);
      this.form.controls['proveedorId'].setValue(Number(proveedor.id));
      this.cdr.markForCheck();
    });
  }

  onBuscarMoneda(): void {
    this.muebleDialogService.onBuscarMoneda((moneda: any) => {
      this.monedaSelected = moneda;
      this.monedaDescripcion = (moneda.denominacion || moneda.simbolo)?.toUpperCase() || '';
      this.form.controls['monedaId'].setValue(moneda.id);
      this.cdr.markForCheck();
    });
  }

  onCancelar(): void {
    this.muebleDialogService.onCancelar(this.dialogRef);
  }

  onGuardar(): void {
    if (this.estado.guardarBloqueado) return;
    const situacionEnviada = this.situacionPagoControl.value;
    const cerrar = !!this.mueble?.id && this.registroGuardado;
    this.muebleDialogService.onGuardar(this.form, this.mueble, this.dialogRef, this.cuotasDetalle, cerrar)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!res?.id) return;
        this.mueble = { ...this.mueble, ...res, id: res.id };
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

  private getProveedorNombre(proveedor: Proveedor | Persona): string {
    const nombre = (proveedor as Proveedor)?.persona?.nombre ?? (proveedor as Persona)?.nombre;
    return nombre?.toUpperCase() || 'SELECCIONE UN PROVEEDOR';
  }
}
