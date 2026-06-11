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
import { EditProveedorComponent, EditProveedorResult } from '../../../../personas/proveedor/edit-proveedor/edit-proveedor.component';
import { EnteService } from '../../../../activos/ente/service/ente.service';
import { Ente } from '../../../../activos/ente/models/ente.model';
import { TipoEnte } from '../../../../activos/ente/enums/tipo-ente.enum';
import { FilaMontoErrores } from '../../interface/fila-monto-errores.interface';
import { FilaMontoVista } from '../../interface/fila-monto-vista.interface';
import { SolicitudGastoSimpleData } from '../../interface/solicitud-gasto-simple-data.interface';
import { SolicitudGastoSimpleMontoLinea } from '../../interface/solicitud-gasto-simple-monto-linea.interface';
import { SolicitudGastoSimpleResult } from '../../interface/solicitud-gasto-simple-result.interface';

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
  enteDisplayControl = new FormControl('');
  enteIdControl = new FormControl<number | null>(null);

  listaMonedas: Moneda[] = [];
  selectedEnte: Ente | null = null;
  filasMontoView: FilaMontoVista[] = [];

  requiereEnteActivo = false;
  etiquetaEnteActivo = 'Activo';
  etiquetaEnteActivoMinuscula = 'activo';
  iconoEnteActivo = 'directions_car';
  placeholderEnteActivo = 'Seleccione activo';
  mensajeErrorEnteActivo = 'Debe seleccionar activo';
  textoBuscarEnteActivo = 'Buscar Activo';
  formularioValido = false;
  descripcionRequerida = false;
  vencimientoRequerido = false;
  enteRequerido = false;
  proveedorRequerido = false;

  constructor(
    private matDialogRef: MatDialogRef<SolicitudGastoSimpleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SolicitudGastoSimpleData,
    private monedaService: MonedaService,
    private mainService: MainService,
    private matDialog: MatDialog,
    private proveedoresSearchByPersonaPageGQL: ProveedoresSearchByPersonaPageGQL,
    private enteService: EnteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.tipoGastoDescripcionControl.setValue(this.data.tipoGastoDescripcion);
      this.solicitanteNombreControl.setValue(this.data.solicitanteNombre);
    }

    this.inicializarPropiedadesEnteActivo();
    this.actualizarValidadoresEnte();
    this.suscribirEstadoFormulario();

    if (this.mainService.sucursalActual) {
      this.sucursalRetiroControl.setValue(this.mainService.sucursalActual.nombre);
    }

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.listaMonedas = res;
        if (this.filasMonto.length === 0) {
          this.agregarFilaMonto(false);
        } else {
          this.actualizarVistasFilasMonto();
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

  private opcionesCurrencyPorMonedaId(monedaId: number | null | undefined): object {
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
        this.actualizarVistasFilasMonto();
        this.cdr.markForCheck();
      });

    grupo
      .get('monedaId')!
      .statusChanges.pipe(startWith(grupo.get('monedaId')!.status), untilDestroyed(this))
      .subscribe(() => {
        this.actualizarErroresVistaFilasMonto();
        this.cdr.markForCheck();
      });

    grupo
      .get('monto')!
      .statusChanges.pipe(startWith(grupo.get('monto')!.status), untilDestroyed(this))
      .subscribe(() => {
        this.actualizarErroresVistaFilasMonto();
        this.cdr.markForCheck();
      });

    this.filasMonto.push(grupo);
    this.filasMontoView.push({
      grupo,
      opcionesCurrency: this.opcionesCurrencyPorMonedaId(grupo.get('monedaId')?.value),
      opcionesMoneda: [],
      errores: this.erroresInicialesFilaMonto(),
    });
    this.actualizarErroresMonedasDuplicadas();
    this.actualizarVistasFilasMonto();
    if (markForCheck) {
      this.cdr.markForCheck();
    }
  }

  quitarFilaMonto(index: number): void {
    if (this.filasMonto.length <= 1) {
      return;
    }
    this.filasMonto.removeAt(index);
    this.filasMontoView.splice(index, 1);
    this.actualizarErroresMonedasDuplicadas();
    this.actualizarVistasFilasMonto();
    this.cdr.markForCheck();
  }

  private monedaOcupadaEnOtraFila(monedaId: number | null | undefined, filaIndex: number): boolean {
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

  private actualizarVistasFilasMonto(): void {
    this.filasMontoView.forEach((vista, filaIndex) => {
      const monedaId = vista.grupo.get('monedaId')?.value as number | null | undefined;
      vista.opcionesCurrency = this.opcionesCurrencyPorMonedaId(monedaId);
      vista.opcionesMoneda = this.listaMonedas.map(moneda => ({
        moneda,
        deshabilitada: this.monedaOcupadaEnOtraFila(moneda.id, filaIndex),
      }));
    });
    this.actualizarErroresVistaFilasMonto();
  }

  private erroresInicialesFilaMonto(): FilaMontoErrores {
    return {
      monedaRequerida: false,
      monedaDuplicada: false,
      montoRequerido: false,
      montoMinimo: false,
    };
  }

  private actualizarErroresVistaFilasMonto(): void {
    this.filasMontoView.forEach(vista => {
      const monedaCtrl = vista.grupo.get('monedaId');
      const montoCtrl = vista.grupo.get('monto');
      vista.errores = {
        monedaRequerida: !!monedaCtrl?.hasError('required'),
        monedaDuplicada: !!monedaCtrl?.hasError('monedaDuplicada'),
        montoRequerido: !!montoCtrl?.hasError('required'),
        montoMinimo: !!montoCtrl?.hasError('min'),
      };
    });
  }

  private actualizarErroresFormulario(): void {
    this.descripcionRequerida = this.descripcionControl.hasError('required');
    this.vencimientoRequerido = this.vencimientoControl.hasError('required');
    this.enteRequerido = this.enteIdControl.hasError('required');
    this.proveedorRequerido = this.proveedorIdControl.hasError('required');
  }

  private inicializarPropiedadesEnteActivo(): void {
    const modulo = this.data?.moduloPadre;
    this.requiereEnteActivo = this.tipoEnteDesdeModuloPadre() != null;

    switch (modulo) {
      case 'VEHICULO':
        this.etiquetaEnteActivo = 'Vehículo';
        break;
      case 'MUEBLE':
        this.etiquetaEnteActivo = 'Mueble';
        break;
      case 'INMUEBLE':
        this.etiquetaEnteActivo = 'Inmueble';
        break;
      default:
        this.etiquetaEnteActivo = 'Activo';
    }

    switch (modulo) {
      case 'MUEBLE':
        this.iconoEnteActivo = 'chair';
        break;
      case 'INMUEBLE':
        this.iconoEnteActivo = 'domain';
        break;
      default:
        this.iconoEnteActivo = 'directions_car';
    }

    this.etiquetaEnteActivoMinuscula = this.etiquetaEnteActivo.toLowerCase();
    this.placeholderEnteActivo = `Seleccione ${this.etiquetaEnteActivoMinuscula}`;
    this.mensajeErrorEnteActivo = `Debe seleccionar ${this.etiquetaEnteActivoMinuscula}`;
    this.textoBuscarEnteActivo = `Buscar ${this.etiquetaEnteActivo}`;
  }

  private suscribirEstadoFormulario(): void {
    const controles = [
      this.descripcionControl,
      this.vencimientoControl,
      this.proveedorIdControl,
      this.enteIdControl,
    ];

    controles.forEach(control => {
      control.statusChanges
        .pipe(startWith(control.status), untilDestroyed(this))
        .subscribe(() => this.actualizarFormularioValido());
    });

    this.filasMonto.statusChanges
      .pipe(startWith(this.filasMonto.status), untilDestroyed(this))
      .subscribe(() => this.actualizarFormularioValido());
  }

  private actualizarFormularioValido(): void {
    this.formularioValido =
      this.descripcionControl.valid &&
      this.vencimientoControl.valid &&
      this.filasMonto.valid &&
      this.proveedorIdControl.valid &&
      this.enteIdControl.valid;
    this.actualizarErroresFormulario();
    this.actualizarErroresVistaFilasMonto();
    this.cdr.markForCheck();
  }

  private tipoEnteDesdeModuloPadre(): TipoEnte | null {
    const modulo = this.data?.moduloPadre;
    if (modulo === 'VEHICULO' || modulo === 'MUEBLE' || modulo === 'INMUEBLE') {
      return modulo as TipoEnte;
    }
    return null;
  }

  private actualizarValidadoresEnte(): void {
    const tipo = this.tipoEnteDesdeModuloPadre();
    this.enteIdControl.clearValidators();
    if (tipo != null) {
      this.enteIdControl.addValidators(Validators.required);
    }
    this.enteIdControl.updateValueAndValidity();
  }

  abrirBuscadorEnteActivo(): void {
    const tipo = this.tipoEnteDesdeModuloPadre();
    if (!tipo) {
      return;
    }
    this.enteService.abrirBuscadorEnte(tipo).pipe(untilDestroyed(this)).subscribe(ente => {
      if (ente?.id) {
        this.selectedEnte = ente;
        this.enteIdControl.setValue(ente.id);
        this.enteDisplayControl.setValue(this.descripcionEnte(ente));
        this.cdr.markForCheck();
      }
    });
  }

  private descripcionEnte(ente: Ente): string {
    const tipo = ente.tipoEnte ?? this.data?.moduloPadre ?? '';
    const ref = ente.referenciaId != null ? `#${ente.referenciaId}` : '';
    const desc = ente.descripcion?.trim();
    if (desc) {
      return `[${tipo}] ${desc}`;
    }
    return `[${tipo}] Ente ${ente.id}${ref ? ' — Ref. ' + ref : ''}`;
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

  abrirAdicionarProveedor(): void {
    this.matDialog
      .open(EditProveedorComponent, {
        width: '600px',
        data: {},
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: EditProveedorResult | undefined) => {
        if (res?.saved && res?.proveedor?.id) {
          this.proveedorIdControl.setValue(res.proveedor.id);
          this.beneficiarioControl.setValue(res.proveedor.persona?.nombre || '');
          this.cdr.markForCheck();
        }
      });
  }

  onCancelar(): void {
    this.matDialogRef.close();
  }

  onSolicitar(): void {
    if (!this.formularioValido) {
      return;
    }

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
      proveedorId: this.proveedorIdControl.value,
      enteId: this.enteIdControl.value ?? null,
    };
    this.matDialogRef.close(resultado);
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
    this.actualizarErroresVistaFilasMonto();
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
