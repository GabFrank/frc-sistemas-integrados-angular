import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InmuebleService } from '../../service/inmueble.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Inmueble } from '../../models/inmueble.model';
import { Pais } from '../../../../general/pais/pais.model';
import { Ciudad } from '../../../../general/ciudad/ciudad.model';
import { Persona } from '../../../../personas/persona/persona.model';
import { InmuebleInput } from '../../models/inmueble-input.model';
import { MainService } from '../../../../../main.service';

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
  private cdr = inject(ChangeDetectorRef);
  private mainService = inject(MainService);

  form: FormGroup;
  inmueble: Inmueble;
  
  situacionesPago = ['PAGADO', 'PAGANDO', 'DADO', 'GANADO'];
  monedas = ['PYG', 'USD', 'BRL'];

  paisSelected: Pais;
  ciudadSelected: Ciudad;
  propietarioSelected: Persona;

  paisDescripcion: string = 'SELECCIONE UN PAÍS';
  ciudadDescripcion: string = 'SELECCIONE UNA CIUDAD';
  propietarioDescripcion: string = 'SELECCIONE UN PROPIETARIO';

  constructor(
    public dialogRef: MatDialogRef<InmuebleFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Inmueble
  ) { }

  ngOnInit(): void {
    this.inmueble = this.data;
    this.inicializarFormulario();

    if (this.inmueble?.id) {
      this.inmuebleService.onBuscarPorId(this.inmueble.id).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.inmueble = res;
          this.cargarDatos();
        }
      });
    } else {
      this.cargarDatos();
    }
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
      situacionPago: ['PAGADO'],
      proveedor: [null],
      moneda: ['PYG'],
      montoTotal: [0],
      montoYaPagado: [0],
      cantidadCuotas: [0],
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
        // ... otros campos
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
    }
    this.cdr.markForCheck();
  }

  onBuscarPropietario(): void {
    this.inmuebleService.abrirBuscadorPropietario().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.propietarioSelected = res;
        this.propietarioDescripcion = res.nombre?.toUpperCase() || '';
        this.form.get('propietarioId')?.setValue(res.id);
        this.cdr.markForCheck();
      }
    });
  }

  onBuscarPais(): void {
    this.inmuebleService.abrirBuscadorPais().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.paisSelected = res;
        this.paisDescripcion = res.descripcion?.toUpperCase() || '';
        this.form.get('paisId')?.setValue(res.id);
        this.cdr.markForCheck();
      }
    });
  }

  onBuscarCiudad(): void {
    this.inmuebleService.abrirBuscadorCiudad().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.ciudadSelected = res;
        this.ciudadDescripcion = res.descripcion?.toUpperCase() || '';
        this.form.get('ciudadId')?.setValue(res.id);
        this.cdr.markForCheck();
      }
    });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  onGuardar(): void {
    if (this.form.valid) {
      const values = this.form.getRawValue();
      const input: InmuebleInput = {
        ...values,
        id: values.id ? Number(values.id) : undefined,
        propietarioId: Number(values.propietarioId),
        paisId: Number(values.paisId),
        ciudadId: Number(values.ciudadId),
        usuarioId: this.mainService.usuarioActual?.id || this.inmueble?.usuario?.id
      };
      this.inmuebleService.onGuardar(input).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) this.dialogRef.close(true);
      });
    }
  }
}
