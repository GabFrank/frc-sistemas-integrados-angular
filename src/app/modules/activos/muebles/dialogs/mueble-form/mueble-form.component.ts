import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MuebleService } from '../../service/mueble.service';
import { MuebleDialogService } from '../../service/mueble-dialog-service.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Mueble } from '../../models/mueble.model';
import { Persona } from '../../../../personas/persona/persona.model';
import { FamiliaMueble } from '../../models/familia-mueble.model';
import { TipoMueble } from '../../models/tipo-mueble.model';

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
    this.muebleDialogService.onBuscarPropietario((persona: Persona) => {
      this.propietarioSelected = persona;
      this.propietarioDescripcion = persona.nombre?.toUpperCase() || '';
      this.form.get('propietarioId')?.setValue(Number(persona.id));
      this.cdr.markForCheck();
    });
  }

  onBuscarFamilia(): void {
    this.muebleDialogService.onBuscarFamilia((familia: FamiliaMueble) => {
      this.familiaSelected = familia;
      this.familiaDescripcion = familia.descripcion?.toUpperCase() || '';
      this.form.get('familiaId')?.setValue(familia.id);
      this.cdr.markForCheck();
    });
  }

  onBuscarTipo(): void {
    this.muebleDialogService.onBuscarTipo(this.familiaSelected?.id, (tipo: TipoMueble) => {
      this.tipoMuebleSelected = tipo;
      this.tipoMuebleDescripcion = tipo.descripcion?.toUpperCase() || '';
      this.form.get('tipoMuebleId')?.setValue(tipo.id);
      this.cdr.markForCheck();
    });
  }

  onBuscarProveedor(): void {
    this.muebleDialogService.onBuscarProveedor((persona: Persona) => {
      this.proveedorSelected = persona;
      this.proveedorDescripcion = persona.nombre?.toUpperCase() || '';
      this.form.get('proveedorId')?.setValue(Number(persona.id));
      this.cdr.markForCheck();
    });
  }

  onBuscarMoneda(): void {
    this.muebleDialogService.onBuscarMoneda((moneda: any) => {
      this.monedaSelected = moneda;
      this.monedaDescripcion = (moneda.denominacion || moneda.simbolo)?.toUpperCase() || '';
      this.form.get('monedaId')?.setValue(moneda.id);
      this.cdr.markForCheck();
    });
  }

  onCancelar(): void {
    this.muebleDialogService.onCancelar(this.dialogRef);
  }

  onGuardar(): void {
    this.muebleDialogService.onGuardar(this.form, this.mueble, this.dialogRef);
  }
}
