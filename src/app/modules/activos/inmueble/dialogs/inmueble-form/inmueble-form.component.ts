import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InmuebleService } from '../../service/inmueble.service';
import { InmuebleDialogService } from '../../service/inmueble-dialog-service.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { finalize, startWith } from 'rxjs/operators';
import { Inmueble } from '../../models/inmueble.model';
import { Pais } from '../../../../general/pais/pais.model';
import { Ciudad } from '../../../../general/ciudad/ciudad.model';
import { Persona } from '../../../../personas/persona/persona.model';
import { Proveedor } from '../../../../personas/proveedor/proveedor.model';
import { EnteService } from '../../../ente/service/ente.service';
import { TipoEnte } from '../../../ente/enums/tipo-ente.enum';
import { CuotaDetalle } from '../../../shared/models/cuota-detalle.model';
import { CONSULTA_BIEN, EstadoFormularioBien, LECTURA_BIEN } from '../../../shared/forms/estado-formulario-bien';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { ARCHIVOS_INMUEBLE } from '../../../shared/constants/archivo-tipos.constants';

@UntilDestroy()
@Component({
  selector: 'app-inmueble-form',
  templateUrl: './inmueble-form.component.html',
  styleUrls: ['./inmueble-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InmuebleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inmuebleService = inject(InmuebleService);
  private inmuebleDialogService = inject(InmuebleDialogService);
  private enteService = inject(EnteService);
  private cdr = inject(ChangeDetectorRef);
  private notificacionService = inject(NotificacionSnackbarService);

  enteId: number | null = null;
  cuotasDetalle: CuotaDetalle[] = [];
  archivosTipos = ARCHIVOS_INMUEBLE;
  registroGuardado = false;

  form: FormGroup;
  inmueble: Inmueble;
  
  situacionPagoControl = this.fb.control('PAGADO');
  situacionPago$ = this.situacionPagoControl.valueChanges.pipe(
    startWith(this.situacionPagoControl.value)
  );

  situacionesPago = ['PAGADO', 'PAGANDO', 'DADO', 'GANADO'];
  monedas = ['PYG', 'USD', 'BRL'];
  currencyMask = new CurrencyMask();

  paisSelected: Pais;
  ciudadSelected: Ciudad;
  propietarioSelected: Persona;
  proveedorSelected: Proveedor | Persona;
  monedaSelected: any;

  paisDescripcion: string = 'SELECCIONE UN PAÍS';
  ciudadDescripcion: string = 'SELECCIONE UNA CIUDAD';
  propietarioDescripcion: string = 'SELECCIONE UN PROPIETARIO';
  proveedorDescripcion: string = 'SELECCIONE UN PROVEEDOR';
  monedaDescripcion: string = 'SELECCIONE UNA MONEDA';

  constructor(
    public dialogRef: MatDialogRef<InmuebleFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Inmueble
  ) { }

  ngOnInit(): void {
    this.inmueble = this.data;
    this.inicializarFormulario();

    this.situacionPagoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.estado.recalcular());
    if (this.inmueble?.id) {
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
    const id = this.inmueble?.id;
    if (!id) return;
    this.estado.actualizar({ bien: 'cargando' });
    this.inmuebleService.onBuscarPorId(id, LECTURA_BIEN, CONSULTA_BIEN).pipe(untilDestroyed(this)).subscribe({
      error: () => this.estado.actualizar({ bien: 'error' }),
      next: (res) => {
        if (!res) {
          this.estado.actualizar({ bien: 'error' });
          return;
        }
        this.inmueble = res;
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
    const id = this.inmueble?.id;
    if (!id) return;
    const conCuotas = this.estado.eraPagando;
    const lectura = ++this.estado.lectura;
    this.estado.actualizar({ cuotas: conCuotas ? 'cargando' : 'sin-cargar', enteFallo: false });
    this.enteService.cargarEnteYCuotas(TipoEnte.INMUEBLE, id, conCuotas).pipe(untilDestroyed(this)).subscribe({
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
      nombreAsignado: ['', Validators.required],
      paisId: [null, Validators.required],
      ciudadId: [null, Validators.required],
      direccion: [''],
      googleMapsUrl: [''],
      codigoCatastral: [''],
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
    if (this.inmueble) {
      this.form.patchValue({
        id: this.inmueble.id,
        propietarioId: this.inmueble.propietario?.id,
        nombreAsignado: this.inmueble.nombreAsignado,
        paisId: this.inmueble.pais?.id,
        ciudadId: this.inmueble.ciudad?.id,
        direccion: this.inmueble.direccion,
        googleMapsUrl: this.inmueble.googleMapsUrl,
        codigoCatastral: this.inmueble.codigoCatastral,
        valorTasacion: this.inmueble.valorTasacion,
        valorTasacionPyg: this.inmueble.valorTasacionPyg || 0,
        valorTasacionBrl: this.inmueble.valorTasacionBrl || 0,
        situacionPago: this.inmueble.situacionPago || 'PAGADO',
        proveedorId: this.inmueble.proveedor?.id,
        monedaId: this.inmueble.moneda?.id,
        montoTotal: this.inmueble.montoTotal || 0,
        montoYaPagado: this.inmueble.montoYaPagado || 0,
        cantidadCuotas: this.inmueble.cantidadCuotas || 1,
        cantidadCuotasPagadas: this.inmueble.cantidadCuotasPagadas || 0,
        diaVencimiento: this.inmueble.diaVencimiento || 1
      });

      if (this.inmueble.pais) {
        this.paisSelected = this.inmueble.pais;
        this.paisDescripcion = this.inmueble.pais.descripcion?.toUpperCase() || '';
      }
      if (this.inmueble.ciudad) {
        this.ciudadSelected = this.inmueble.ciudad;
        this.ciudadDescripcion = this.inmueble.ciudad.descripcion?.toUpperCase() || '';
      }
      if (this.inmueble.propietario) {
        this.propietarioSelected = this.inmueble.propietario;
        this.propietarioDescripcion = this.inmueble.propietario.nombre?.toUpperCase() || '';
      }
      if (this.inmueble.proveedor) {
        this.proveedorSelected = this.inmueble.proveedor;
        this.proveedorDescripcion = this.getProveedorNombre(this.inmueble.proveedor);
      }
      if (this.inmueble.moneda) {
        this.monedaSelected = this.inmueble.moneda;
        this.monedaDescripcion = (this.inmueble.moneda.denominacion || this.inmueble.moneda.simbolo)?.toUpperCase() || '';
      }
    }
    this.cdr.markForCheck();
  }

  onBuscarPropietario(): void {
    this.inmuebleDialogService.onBuscarPropietario((persona: Persona) => {
      this.propietarioSelected = persona;
      this.propietarioDescripcion = persona.nombre?.toUpperCase() || '';
      this.form.controls['propietarioId'].setValue(Number(persona.id));
      this.cdr.markForCheck();
    });
  }

  onBuscarProveedor(): void {
    this.inmuebleDialogService.onBuscarProveedor((proveedor: Proveedor) => {
      this.proveedorSelected = proveedor;
      this.proveedorDescripcion = this.getProveedorNombre(proveedor);
      this.form.controls['proveedorId'].setValue(proveedor.id);
      this.cdr.markForCheck();
    });
  }

  onBuscarMoneda(): void {
    this.inmuebleDialogService.onBuscarMoneda((moneda: any) => {
      this.monedaSelected = moneda;
      this.monedaDescripcion = (moneda.denominacion || moneda.simbolo)?.toUpperCase() || '';
      this.form.controls['monedaId'].setValue(moneda.id);
      this.cdr.markForCheck();
    });
  }

  onBuscarPais(): void {
    this.inmuebleDialogService.onBuscarPais((pais: Pais) => {
      this.paisSelected = pais;
      this.paisDescripcion = pais.descripcion?.toUpperCase() || '';
      this.form.controls['paisId'].setValue(Number(pais.id));
      this.cdr.markForCheck();
    });
  }

  onBuscarCiudad(): void {
    this.inmuebleDialogService.onBuscarCiudad((ciudad: Ciudad) => {
      this.ciudadSelected = ciudad;
      this.ciudadDescripcion = ciudad.descripcion?.toUpperCase() || '';
      this.form.controls['ciudadId'].setValue(Number(ciudad.id));
      if (ciudad.pais?.id) {
        this.paisSelected = ciudad.pais;
        this.paisDescripcion = ciudad.pais.descripcion?.toUpperCase() || '';
        this.form.controls['paisId'].setValue(Number(ciudad.pais.id));
      }
      this.cdr.markForCheck();
    });
  }

  onCancelar(): void {
    // Con un alta sin confirmar, cerrar refresca la lista: el bien pudo haberse guardado
    this.inmuebleDialogService.onCancelar(this.dialogRef, this.estado.altaSinConfirmar);
  }

  onGuardar(): void {
    if (this.estado.guardarBloqueado) return;
    const situacionEnviada = this.situacionPagoControl.value;
    // «Alta» es lo que ve el servidor: se envía sin id (se calcula antes de enviar)
    const esAlta = !this.form.getRawValue().id;
    const cerrar = !!this.inmueble?.id && this.registroGuardado;
    this.estado.actualizar({ guardando: true });
    this.inmuebleDialogService.onGuardar(this.form, this.inmueble, this.dialogRef, this.cuotasDetalle, cerrar)
      // Se libera también en `next`: el genérico puede emitir sin completar
      .pipe(untilDestroyed(this), finalize(() => this.estado.actualizar({ guardando: false })))
      .subscribe({ error: (error) => {
        const aviso = this.estado.alFallarElGuardado(error, esAlta);
        if (aviso) this.notificacionService.openWarn(aviso, 10);
      }, next: (res) => {
        this.estado.actualizar({ guardando: false });
        if (!res?.id) return;
        this.inmueble = { ...this.inmueble, ...res, id: res.id };
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

  private getProveedorNombre(proveedor: Proveedor | Persona): string {
    const nombre = (proveedor as Proveedor)?.persona?.nombre ?? (proveedor as Persona)?.nombre;
    return nombre?.toUpperCase() || 'SELECCIONE UN PROVEEDOR';
  }
}
