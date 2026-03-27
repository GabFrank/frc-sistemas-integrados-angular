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

  situacionesPago = ['PAGADO', 'PAGANDO', 'DADO', 'GANADO', 'COMODATO'];
  monedas = ['PYG', 'USD', 'BRL'];

  proveedorSelected: Persona;
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
      proveedorId: [null],
      monedaId: [null],
      montoTotal: [0],
      montoYaPagado: [0],
      cantidadCuotas: [1],
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
        situacionPago: this.mueble.situacionPago || 'PAGADO',
        proveedorId: this.mueble.proveedor?.id,
        monedaId: this.mueble.moneda?.id,
        montoTotal: this.mueble.montoTotal || 0,
        montoYaPagado: this.mueble.montoYaPagado || 0,
        cantidadCuotas: this.mueble.cantidadCuotas || 1,
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
        this.proveedorDescripcion = this.mueble.proveedor.nombre?.toUpperCase() || '';
      }
      if (this.mueble.moneda) {
        this.monedaSelected = this.mueble.moneda;
        this.monedaDescripcion = this.mueble.moneda.denominacion?.toUpperCase() || '';
      }
    }
    this.cdr.markForCheck();
  }

  onBuscarPropietario(): void {
    this.muebleService.abrirBuscadorPropietario().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.propietarioSelected = res;
        this.propietarioDescripcion = res.nombre?.toUpperCase() || '';
        this.form.get('propietarioId')?.setValue(Number(res.id));
        this.cdr.markForCheck();
      }
    });
  }

  onBuscarFamilia(): void {
    this.muebleService.abrirBuscadorFamilia().pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (res) {
        if (res.adicionar) {
          this.onAdicionarFamilia();
        } else {
          this.familiaSelected = res;
          this.familiaDescripcion = res.descripcion?.toUpperCase() || '';
          this.form.get('familiaId')?.setValue(res.id);
          this.cdr.markForCheck();
        }
      }
    });
  }

  onAdicionarFamilia(): void {
    this.muebleService.abrirAdicionarFamilia().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.familiaSelected = res;
        this.familiaDescripcion = res.descripcion?.toUpperCase() || '';
        this.form.get('familiaId')?.setValue(Number(res.id));
        this.cdr.markForCheck();
      }
    });
  }

  onBuscarTipo(): void {
    this.muebleService.abrirBuscadorTipo().pipe(untilDestroyed(this)).subscribe((res: any) => {
      if (res) {
        if (res.adicionar) {
          this.onAdicionarTipo();
        } else {
          this.tipoMuebleSelected = res;
          this.tipoMuebleDescripcion = res.descripcion?.toUpperCase() || '';
          this.form.get('tipoMuebleId')?.setValue(res.id);
          this.cdr.markForCheck();
        }
      }
    });
  }

  onAdicionarTipo(): void {
    this.muebleService.abrirAdicionarTipo(this.familiaSelected?.id).pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.tipoMuebleSelected = res;
        this.tipoMuebleDescripcion = res.descripcion?.toUpperCase() || '';
        this.form.get('tipoMuebleId')?.setValue(Number(res.id));
        this.cdr.markForCheck();
      }
    });
  }

  onBuscarProveedor(): void {
    // We use the same proprietor search for vendor, since they are all Personas
    this.muebleService.abrirBuscadorPropietario().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.proveedorSelected = res;
        this.proveedorDescripcion = res.nombre?.toUpperCase() || '';
        this.form.get('proveedorId')?.setValue(Number(res.id));
        this.cdr.markForCheck();
      }
    });
  }

  onBuscarMoneda(): void {
    this.muebleService.abrirBuscadorMoneda().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.monedaSelected = res;
        this.monedaDescripcion = (res.denominacion || res.simbolo)?.toUpperCase() || '';
        this.form.get('monedaId')?.setValue(res.id);
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
        proveedorId: values.proveedorId ? Number(values.proveedorId) : undefined,
        monedaId: values.monedaId ? Number(values.monedaId) : undefined,
        usuarioId: this.mainService.usuarioActual?.id || this.mueble?.usuario?.id
      };
      this.muebleService.onGuardar(input).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) this.dialogRef.close(true);
      });
    }
  }
}
