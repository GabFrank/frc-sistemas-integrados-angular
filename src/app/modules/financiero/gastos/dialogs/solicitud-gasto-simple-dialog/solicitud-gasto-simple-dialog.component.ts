import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { startWith } from 'rxjs/operators';
import { MainService } from '../../../../../main.service';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { Moneda } from '../../../moneda/moneda.model';
import { MonedaService } from '../../../moneda/moneda.service';
import { ProveedoresSearchByPersonaPageGQL } from '../../../../personas/proveedor/graphql/proveedorSearchByPersonaPage';

export interface SolicitudGastoSimpleData {
  tipoGastoId: number;
  tipoGastoDescripcion: string;
  requiereAutorizacion?: boolean;
  solicitanteId: number;
  solicitanteNombre: string;
}

export interface SolicitudGastoSimpleMontoLinea {
  monedaId: number;
  monto: number;
}

export interface SolicitudGastoSimpleResult {
  tipoGastoId: number;
  solicitanteId: number;
  descripcion: string;
  vencimiento: Date;
  montos: SolicitudGastoSimpleMontoLinea[];
  monedaId?: number;
  monto?: number;
  sucursalRetiroId?: number;
  proveedorId: number | null;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-solicitud-gasto-simple-dialog',
  templateUrl: './solicitud-gasto-simple-dialog.component.html',
  styleUrls: ['./solicitud-gasto-simple-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudGastoSimpleDialogComponent implements OnInit {
  tipoGastoDescripcionControl = new FormControl({ value: '', disabled: true });
  solicitanteNombreControl = new FormControl({ value: '', disabled: true });
  descripcionControl = new FormControl('', Validators.required);
  vencimientoControl = new FormControl(new Date(), Validators.required);
  filasMonto = new FormArray<FormGroup>([]);
  sucursalRetiroControl = new FormControl({ value: '', disabled: true });
  beneficiarioControl = new FormControl('', Validators.required);
  proveedorIdControl = new FormControl<number | null>(null, Validators.required);

  listaMonedas: Moneda[] = [];

  constructor(
    private matDialogRef: MatDialogRef<SolicitudGastoSimpleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SolicitudGastoSimpleData,
    private monedaService: MonedaService,
    private mainService: MainService,
    private matDialog: MatDialog,
    private proveedoresSearchByPersonaPageGQL: ProveedoresSearchByPersonaPageGQL,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.tipoGastoDescripcionControl.setValue(this.data.tipoGastoDescripcion);
      this.solicitanteNombreControl.setValue(this.data.solicitanteNombre);
    }  

    if (this.mainService.sucursalActual) {
      this.sucursalRetiroControl.setValue(this.mainService.sucursalActual.nombre);
    }

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.listaMonedas = res;
        if (this.filasMonto.length === 0) {
          this.agregarFilaMonto(false);
        }
        this.cdr.markForCheck();
      }
    });
  }

  esMonedaGuarani(m: Moneda): boolean {
    return (m.denominacion || '').trim().toUpperCase() === 'GUARANI';
  }

  primeraMonedaGuarani(): Moneda | undefined {
    return this.listaMonedas.find(m => this.esMonedaGuarani(m));
  }

  currencyMaskOptionsForMonedaId(monedaId: number | null | undefined): object {
    const m = this.listaMonedas.find(x => x.id === monedaId);
    return m ? this.monedaService.currencyOptionsByMoneda(m) : this.monedaService.currencyOptionsGuarani;
  }

  private aplicarValidadoresMontoPorMoneda(grupo: FormGroup): void {
    const moneda = this.listaMonedas.find(x => x.id === grupo.get('monedaId')?.value);
    const montoCtrl = grupo.get('monto');
    if (!montoCtrl) {
      return;
    }
    const esGuarani = moneda ? this.esMonedaGuarani(moneda) : true;
    montoCtrl.clearValidators();
    montoCtrl.addValidators([Validators.required, esGuarani ? Validators.min(1) : Validators.min(0.01)]);
    montoCtrl.updateValueAndValidity({ emitEvent: false });
  }

  agregarFilaMonto(markForCheck = true): void {
    const defaultMonedaId = this.primeraMonedaGuarani()?.id ?? this.listaMonedas[0]?.id ?? null;
    const grupo = new FormGroup({
      monedaId: new FormControl<number | null>(defaultMonedaId, Validators.required),
      monto: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    });

    this.aplicarValidadoresMontoPorMoneda(grupo);

    grupo
      .get('monedaId')!
      .valueChanges.pipe(startWith(grupo.get('monedaId')!.value), untilDestroyed(this))
      .subscribe(() => {
        this.aplicarValidadoresMontoPorMoneda(grupo);
        this.actualizarErroresMonedasDuplicadas();
        this.cdr.markForCheck();
      });

    this.filasMonto.push(grupo);
    this.actualizarErroresMonedasDuplicadas();
    if (markForCheck) {
      this.cdr.markForCheck();
    }
  }

  quitarFilaMonto(index: number): void {
    if (this.filasMonto.length <= 1) {
      return;
    }
    this.filasMonto.removeAt(index);
    this.actualizarErroresMonedasDuplicadas();
    this.cdr.markForCheck();
  }

  esMonedaOcupada(monedaId: number | null | undefined, filaIndex: number): boolean {
    if (monedaId == null) {
      return false;
    }
    return this.filasMonto.controls.some((control, index) => {
      if (index === filaIndex) {
        return false;
      }
      return control.get('monedaId')?.value === monedaId;
    });
  }

  abrirBuscadorProveedor(): void {
    const data = new SearchListtDialogData();
    data.titulo = 'Seleccionar Proveedor';
    data.query = this.proveedoresSearchByPersonaPageGQL;
    data.isServidor = this.data?.requiereAutorizacion === true;
    data.paginator = true;
    data.searchFieldName = 'texto';
    data.tableData = [
      { id: 'id', nombre: 'ID', width: '50px' },
      { id: 'persona.nombre', nombre: 'Nombre', width: 'auto' },
      { id: 'persona.documento', nombre: 'Documento', width: '150px' },
    ];

    this.matDialog.open(SearchListDialogComponent, {
      data: data,
      width: '80%',
      height: '80%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.proveedorIdControl.setValue(res.id);
        this.beneficiarioControl.setValue(res.persona?.nombre || '');
        this.cdr.markForCheck();
      }
    });
  }

  onCancelar(): void {
    this.matDialogRef.close();
  }

  onSolicitar(): void {
    if (
      this.descripcionControl.valid &&
      this.vencimientoControl.valid &&
      this.filasMonto.valid &&
      this.proveedorIdControl.valid
    ) {
      const lineas: SolicitudGastoSimpleMontoLinea[] = this.filasMonto.controls
        .map(c => (c as FormGroup).value as { monedaId: number; monto: number })
        .filter(v => v.monedaId != null && v.monto != null);

      const primera = lineas[0];
      const resultado: SolicitudGastoSimpleResult = {
        tipoGastoId: this.data.tipoGastoId,
        solicitanteId: this.data.solicitanteId,
        descripcion: this.descripcionControl.value,
        vencimiento: this.vencimientoControl.value,
        montos: lineas,
        monedaId: primera?.monedaId,
        monto: primera?.monto,
        sucursalRetiroId: this.mainService.sucursalActual?.id,
        proveedorId: this.proveedorIdControl.value
      };
      this.matDialogRef.close(resultado);
    }
  }

  esFormularioValido(): boolean {
    return this.descripcionControl.valid &&
           this.vencimientoControl.valid &&
           this.filasMonto.valid &&
           this.proveedorIdControl.valid;
  }

  trackByFilaMonto(index: number, fila: FormGroup): FormGroup {
    return fila;
  }

  private actualizarErroresMonedasDuplicadas(): void {
    const cantidadPorMoneda = new Map<number, number>();

    this.filasMonto.controls.forEach(control => {
      const monedaId = control.get('monedaId')?.value as number | null | undefined;
      if (monedaId != null) {
        cantidadPorMoneda.set(monedaId, (cantidadPorMoneda.get(monedaId) ?? 0) + 1);
      }
    });

    this.filasMonto.controls.forEach(control => {
      const monedaIdControl = control.get('monedaId');
      if (!monedaIdControl) {
        return;
      }
      const monedaId = monedaIdControl.value as number | null | undefined;
      const duplicada = monedaId != null && (cantidadPorMoneda.get(monedaId) ?? 0) > 1;
      this.setControlError(monedaIdControl, 'monedaDuplicada', duplicada);
    });
  }

  private setControlError(control: AbstractControl, key: string, enabled: boolean): void {
    const erroresActuales = control.errors ?? {};
    if (enabled) {
      if (!erroresActuales[key]) {
        control.setErrors({ ...erroresActuales, [key]: true });
      }
      return;
    }
    if (erroresActuales[key]) {
      const { [key]: _, ...resto } = erroresActuales;
      control.setErrors(Object.keys(resto).length > 0 ? resto : null);
    }
  }
}
