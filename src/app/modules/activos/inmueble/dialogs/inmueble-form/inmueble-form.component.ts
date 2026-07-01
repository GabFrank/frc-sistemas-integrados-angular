import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InmuebleService } from '../../service/inmueble.service';
import { InmuebleDialogService } from '../../service/inmueble-dialog-service.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { startWith } from 'rxjs/operators';
import { Inmueble } from '../../models/inmueble.model';
import { Pais } from '../../../../general/pais/pais.model';
import { Ciudad } from '../../../../general/ciudad/ciudad.model';
import { Persona } from '../../../../personas/persona/persona.model';
import { Proveedor } from '../../../../personas/proveedor/proveedor.model';
import { EnteService } from '../../../ente/service/ente.service';
import { TipoEnte } from '../../../ente/enums/tipo-ente.enum';
import { CuotaDetalle } from '../../../shared/models/cuota-detalle.model';
import { GenericCrudService } from '../../../../../generics/generic-crud.service';
import { EnteCuotasByEnteIdGQL } from '../../../ente/graphql/enteCuotasByEnteId';
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
  private genericService = inject(GenericCrudService);
  private enteCuotasGQL = inject(EnteCuotasByEnteIdGQL);
  private cdr = inject(ChangeDetectorRef);

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

    if (this.inmueble?.id) {
      this.registroGuardado = true;
      this.inmuebleService.onBuscarPorId(this.inmueble.id).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.inmueble = res;
          this.cargarDatos();
          this.cargarEnteYCuotas(res.id);
        }
      });
    } else {
      this.cargarDatos();
    }
  }

  private cargarEnteYCuotas(referenciaId: number): void {
    this.enteService.onGetByReferenciaId(TipoEnte.INMUEBLE, referenciaId).pipe(untilDestroyed(this)).subscribe(ente => {
      if (!ente?.id) return;
      this.enteId = ente.id;
      this.genericService.onCustomQuery(this.enteCuotasGQL, { enteId: ente.id }).pipe(untilDestroyed(this)).subscribe(cuotas => {
        if (cuotas?.length) {
          this.cuotasDetalle = cuotas.map(c => ({
            numeroCuota: c.numeroCuota || 0,
            monto: c.monto || 0,
            pagado: c.pagado,
          }));
        }
        this.cdr.markForCheck();
      });
    });
  }

  onCuotasChange(cuotas: CuotaDetalle[]): void {
    this.cuotasDetalle = cuotas;
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
    this.inmuebleDialogService.onCancelar(this.dialogRef);
  }

  onGuardar(): void {
    const cerrar = !!this.inmueble?.id && this.registroGuardado;
    this.inmuebleDialogService.onGuardar(this.form, this.inmueble, this.dialogRef, this.cuotasDetalle, cerrar)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!res?.id) return;
        this.inmueble = { ...this.inmueble, ...res, id: res.id };
        this.registroGuardado = true;
        this.form.patchValue({ id: res.id });
        this.cargarEnteYCuotas(res.id);
        this.cdr.markForCheck();
      });
  }

  private getProveedorNombre(proveedor: Proveedor | Persona): string {
    const nombre = (proveedor as Proveedor)?.persona?.nombre ?? (proveedor as Persona)?.nombre;
    return nombre?.toUpperCase() || 'SELECCIONE UN PROVEEDOR';
  }
}
