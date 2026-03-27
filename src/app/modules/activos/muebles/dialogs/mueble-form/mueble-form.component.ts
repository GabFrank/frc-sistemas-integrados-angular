import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MuebleService } from '../../service/mueble.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Mueble } from '../../models/mueble.model';
import { Persona } from '../../../../personas/persona/persona.model';
import { FamiliaMueble } from '../../models/familia-mueble.model';
import { TipoMueble } from '../../models/tipo-mueble.model';
import { MuebleInput } from '../../models/mueble-input.model';
import { MainService } from '../../../../../main.service';

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
  private cdr = inject(ChangeDetectorRef);
  private mainService = inject(MainService);

  form: FormGroup;
  mueble: Mueble;

  propietarioSelected: Persona;
  familiaSelected: FamiliaMueble;
  tipoMuebleSelected: TipoMueble;

  propietarioDescripcion: string = 'SELECCIONE UN PROPIETARIO';
  familiaDescripcion: string = 'SELECCIONE UNA FAMILIA';
  tipoMuebleDescripcion: string = 'SELECCIONE UN TIPO';

  situacionesPago = ['PAGADO', 'PAGANDO', 'DADO', 'GANADO'];
  monedas = ['PYG', 'USD', 'BRL'];

  constructor(
    public dialogRef: MatDialogRef<MuebleFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Mueble
  ) { }

  ngOnInit(): void {
    this.mueble = this.data;
    this.inicializarFormulario();

    if (this.mueble?.id) {
      this.muebleService.onBuscarPorId(this.mueble.id).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.mueble = res;
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
      identificador: ['', Validators.required],
      descripcion: ['', Validators.required],
      familiaId: [null, Validators.required],
      tipoMuebleId: [null, Validators.required],
      consumeEnergia: [false],
      consumoValor: [''],
      valorTasacion: [0],
      situacionPago: ['PAGADO'],
      proveedor: [null],
      moneda: ['PYG'],
      montoTotal: [0]
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
        valorTasacion: this.mueble.valorTasacion
      });

      if (this.mueble.propietario) {
        this.propietarioSelected = this.mueble.propietario;
        this.propietarioDescripcion = this.mueble.propietario.nombre?.toUpperCase() || '';
      }
      if (this.mueble.familia) {
        this.familiaSelected = this.mueble.familia;
        this.familiaDescripcion = this.mueble.familia.descripcion?.toUpperCase() || '';
      }
      if (this.mueble.tipoMueble) {
        this.tipoMuebleSelected = this.mueble.tipoMueble;
        this.tipoMuebleDescripcion = this.mueble.tipoMueble.descripcion?.toUpperCase() || '';
      }
    }
    this.cdr.markForCheck();
  }

  onBuscarPropietario(): void {
    this.muebleService.abrirBuscadorPropietario().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.propietarioSelected = res;
        this.propietarioDescripcion = res.nombre?.toUpperCase() || '';
        this.form.get('propietarioId')?.setValue(res.id);
        this.cdr.markForCheck();
      }
    });
  }

  onBuscarFamilia(): void {
    this.muebleService.abrirBuscadorFamilia().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.familiaSelected = res;
        this.familiaDescripcion = res.descripcion?.toUpperCase() || '';
        this.form.get('familiaId')?.setValue(res.id);
        this.cdr.markForCheck();
      }
    });
  }

  onBuscarTipo(): void {
    this.muebleService.abrirBuscadorTipo().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.tipoMuebleSelected = res;
        this.tipoMuebleDescripcion = res.descripcion?.toUpperCase() || '';
        this.form.get('tipoMuebleId')?.setValue(res.id);
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
      const input: MuebleInput = {
        ...values,
        id: values.id ? Number(values.id) : undefined,
        propietarioId: Number(values.propietarioId),
        familiaId: Number(values.familiaId),
        tipoMuebleId: Number(values.tipoMuebleId),
        usuarioId: this.mainService.usuarioActual?.id || this.mueble?.usuario?.id
      };
      this.muebleService.onGuardar(input).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) this.dialogRef.close(true);
      });
    }
  }
}
