import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OperacionFinanciera, OperacionFinancieraCategoria, TipoOperacionFinanciera, DiferenciaDestinoTipo } from '../operacion-financiera.model';
import { OperacionFinancieraService } from '../operacion-financiera.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { CuentaBancaria } from '../../cuenta-bancaria/cuenta-bancaria.model';
import { CuentaBancariaService } from '../../cuenta-bancaria/cuenta-bancaria.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-operacion-financiera-dialog',
  templateUrl: './add-operacion-financiera-dialog.component.html',
  styleUrls: ['./add-operacion-financiera-dialog.component.scss']
})
export class AddOperacionFinancieraDialogComponent implements OnInit {

  formGroup: FormGroup;
  tipoOperacionControl = new FormControl(TipoOperacionFinanciera.CAMBIO_DIVISA, Validators.required);
  categoriaControl = new FormControl(null);
  descripcionControl = new FormControl('');
  numeroComprobanteControl = new FormControl('');

  cajaMayorOrigenControl = new FormControl(null);
  cuentaBancariaOrigenControl = new FormControl(null);
  monedaOrigenControl = new FormControl(null);
  montoOrigenControl = new FormControl(null, [Validators.min(0.01)]);

  cajaMayorDestinoControl = new FormControl(null);
  cuentaBancariaDestinoControl = new FormControl(null);
  monedaDestinoControl = new FormControl(null);
  montoDestinoControl = new FormControl(null, [Validators.min(0.01)]);

  cotizacionControl = new FormControl(null, [Validators.min(0.000001)]);

  diferenciaControl = new FormControl(null);
  diferenciaDestinoTipoControl = new FormControl(DiferenciaDestinoTipo.IGNORAR);
  diferenciaObservacionControl = new FormControl('');

  tipoOperacionList = [
    { label: 'Cambio de Divisa', value: TipoOperacionFinanciera.CAMBIO_DIVISA, icono: 'currency_exchange', desc: 'Entre monedas en caja' },
    { label: 'Depósito Bancario', value: TipoOperacionFinanciera.DEPOSITO_BANCARIO, icono: 'account_balance', desc: 'Caja → cuenta bancaria' },
    { label: 'Retiro Bancario', value: TipoOperacionFinanciera.RETIRO_BANCARIO, icono: 'savings', desc: 'Cuenta bancaria → caja' },
    { label: 'Transf. entre Cajas', value: TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS, icono: 'swap_horiz', desc: 'Caja → caja' },
    { label: 'Transf. Bancaria', value: TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA, icono: 'sync_alt', desc: 'Cuenta → cuenta' },
  ];

  diferenciaDestinoList = [
    { label: 'Ignorar', value: DiferenciaDestinoTipo.IGNORAR },
    { label: 'Gasto', value: DiferenciaDestinoTipo.GASTO },
    { label: 'Vale', value: DiferenciaDestinoTipo.VALE },
  ];

  categoriaList: OperacionFinancieraCategoria[] = [];
  cajaVirtualList: CajaVirtual[] = [];
  cuentaBancariaList: CuentaBancaria[] = [];
  monedaList: Moneda[] = [];

  // Flags de visibilidad — calculados en TS, nunca en el HTML.
  mostrarCajaOrigen = false;
  mostrarCuentaOrigen = false;
  mostrarCajaDestino = false;
  mostrarCuentaDestino = false;
  mostrarCotizacion = false;
  mostrarDiferencia = true;
  // La moneda de origen/destino es editable solo cuando la maneja una caja mayor
  // y el tipo permite monedas distintas (cambio de divisa). En el resto se autoselecciona.
  monedaOrigenEditable = false;
  monedaDestinoEditable = false;

  tituloActual = '';

  // Opciones de formato de moneda por lado (formato PY, sin negativos).
  currencyOptsOrigen: any = this.buildCurrencyOptions(null);
  currencyOptsDestino: any = this.buildCurrencyOptions(null);

  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<AddOperacionFinancieraDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private operacionFinancieraService: OperacionFinancieraService,
    private cajaVirtualService: CajaVirtualService,
    private cuentaBancariaService: CuentaBancariaService,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService,
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      tipoOperacionControl: this.tipoOperacionControl,
      categoriaControl: this.categoriaControl,
      descripcionControl: this.descripcionControl,
      numeroComprobanteControl: this.numeroComprobanteControl,
      cajaMayorOrigenControl: this.cajaMayorOrigenControl,
      cuentaBancariaOrigenControl: this.cuentaBancariaOrigenControl,
      monedaOrigenControl: this.monedaOrigenControl,
      montoOrigenControl: this.montoOrigenControl,
      cajaMayorDestinoControl: this.cajaMayorDestinoControl,
      cuentaBancariaDestinoControl: this.cuentaBancariaDestinoControl,
      monedaDestinoControl: this.monedaDestinoControl,
      montoDestinoControl: this.montoDestinoControl,
      cotizacionControl: this.cotizacionControl,
      diferenciaControl: this.diferenciaControl,
      diferenciaDestinoTipoControl: this.diferenciaDestinoTipoControl,
      diferenciaObservacionControl: this.diferenciaObservacionControl,
    });

    this.operacionFinancieraService.onGetCategorias().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.categoriaList = res;
    });
    this.cajaVirtualService.onGetActivas().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.cajaVirtualList = res;
    });
    // Solo cuentas propias operables (no de terceros).
    this.cuentaBancariaService.onGetAllOperables().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.cuentaBancariaList = res;
    });
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.monedaList = res;
    });

    this.seleccionarTipo(TipoOperacionFinanciera.CAMBIO_DIVISA);
  }

  seleccionarTipo(tipo: TipoOperacionFinanciera) {
    this.tipoOperacionControl.setValue(tipo);
    this.onTipoOperacionChange();
  }

  onTipoOperacionChange() {
    const tipo = this.tipoOperacionControl.value;
    this.tituloActual = (this.tipoOperacionList.find(t => t.value === tipo)?.label) || 'Operación Financiera';

    this.mostrarCajaOrigen = [TipoOperacionFinanciera.CAMBIO_DIVISA, TipoOperacionFinanciera.DEPOSITO_BANCARIO, TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS].includes(tipo);
    this.mostrarCuentaOrigen = [TipoOperacionFinanciera.RETIRO_BANCARIO, TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA].includes(tipo);
    this.mostrarCajaDestino = [TipoOperacionFinanciera.CAMBIO_DIVISA, TipoOperacionFinanciera.RETIRO_BANCARIO, TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS].includes(tipo);
    this.mostrarCuentaDestino = [TipoOperacionFinanciera.DEPOSITO_BANCARIO, TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA].includes(tipo);
    this.mostrarCotizacion = tipo === TipoOperacionFinanciera.CAMBIO_DIVISA;
    this.mostrarDiferencia = tipo !== TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA;

    // Editable solo en cambio de divisa (cajas con monedas distintas). El resto se autoselecciona.
    this.monedaOrigenEditable = tipo === TipoOperacionFinanciera.CAMBIO_DIVISA;
    this.monedaDestinoEditable = tipo === TipoOperacionFinanciera.CAMBIO_DIVISA;

    // Limpiar todo lo que no aplica.
    this.cajaMayorOrigenControl.setValue(null);
    this.cuentaBancariaOrigenControl.setValue(null);
    this.cajaMayorDestinoControl.setValue(null);
    this.cuentaBancariaDestinoControl.setValue(null);
    this.monedaOrigenControl.setValue(null);
    this.monedaDestinoControl.setValue(null);
    this.montoOrigenControl.setValue(null);
    this.montoDestinoControl.setValue(null);
    this.cotizacionControl.setValue(null);
    this.diferenciaControl.setValue(null);
    this.diferenciaDestinoTipoControl.setValue(DiferenciaDestinoTipo.IGNORAR);

    this.aplicarEstadoMoneda();
    this.actualizarCurrencyOpts();
  }

  private aplicarEstadoMoneda() {
    this.monedaOrigenEditable ? this.monedaOrigenControl.enable({ emitEvent: false }) : this.monedaOrigenControl.disable({ emitEvent: false });
    this.monedaDestinoEditable ? this.monedaDestinoControl.enable({ emitEvent: false }) : this.monedaDestinoControl.disable({ emitEvent: false });
  }

  onCuentaOrigenChange() {
    const cuenta: CuentaBancaria = this.cuentaBancariaOrigenControl.value;
    const moneda = this.resolverMoneda(cuenta?.moneda);
    if (moneda) {
      this.monedaOrigenControl.setValue(moneda);
      // Retiro bancario: la caja destino recibe la misma moneda.
      if (this.tipoOperacionControl.value === TipoOperacionFinanciera.RETIRO_BANCARIO) {
        this.monedaDestinoControl.setValue(moneda);
      }
    }
    this.actualizarCurrencyOpts();
    this.recalcularMontoDestino();
  }

  onCuentaDestinoChange() {
    const cuenta: CuentaBancaria = this.cuentaBancariaDestinoControl.value;
    const moneda = this.resolverMoneda(cuenta?.moneda);
    if (moneda) {
      this.monedaDestinoControl.setValue(moneda);
      // Depósito bancario: la caja origen envía en la misma moneda de la cuenta.
      if (this.tipoOperacionControl.value === TipoOperacionFinanciera.DEPOSITO_BANCARIO) {
        this.monedaOrigenControl.setValue(moneda);
      }
    }
    this.actualizarCurrencyOpts();
    this.recalcularMontoDestino();
  }

  /** Resuelve la moneda completa (con principal/decimales) desde monedaList por id. */
  private resolverMoneda(m: Moneda | null | undefined): Moneda | null {
    if (!m) return null;
    return this.monedaList.find(x => x.id === m.id) || m;
  }

  /** Cambio de moneda de la caja origen (solo cambio de divisa o transf. entre cajas). */
  onMonedaOrigenChange() {
    const tipo = this.tipoOperacionControl.value;
    // Transferencia entre cajas: misma moneda a ambos lados.
    if (tipo === TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS) {
      this.monedaDestinoControl.setValue(this.monedaOrigenControl.value);
    }
    this.actualizarCurrencyOpts();
    this.recalcularMontoDestino();
  }

  onMonedaDestinoChange() {
    this.actualizarCurrencyOpts();
    this.recalcularMontoDestino();
  }

  private actualizarCurrencyOpts() {
    this.currencyOptsOrigen = this.buildCurrencyOptions(this.monedaOrigenControl.value);
    this.currencyOptsDestino = this.buildCurrencyOptions(this.monedaDestinoControl.value);
  }

  /** Formato de moneda PY: Gs sin decimales, resto 2 decimales; miles ".", decimal ","; sin negativos. */
  private buildCurrencyOptions(moneda: Moneda | null): any {
    const decimales = moneda?.decimales != null ? moneda.decimales : (this.esGuarani(moneda) ? 0 : 2);
    return {
      allowNegative: false,
      allowZero: true,
      precision: decimales,
      thousands: '.',
      decimal: decimales > 0 ? ',' : '',
      align: 'right',
      prefix: moneda?.simbolo ? moneda.simbolo + ' ' : '',
      suffix: '',
      nullable: true,
      min: 0,
      max: null,
    };
  }

  private esGuarani(moneda: Moneda | null): boolean {
    return (moneda?.denominacion || '').toUpperCase().includes('GUARANI');
  }

  /** Recalcula montoDestino: en cambio de divisa por cotización; en el resto = montoOrigen (misma moneda). */
  recalcularMontoDestino() {
    const monto = this.montoOrigenControl.value;
    const cot = this.cotizacionControl.value;
    const tipo = this.tipoOperacionControl.value;

    if (tipo === TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA) {
      // Si las cuentas tienen distinta moneda, se usa cotización; si no, igual monto.
      const mo: Moneda = this.monedaOrigenControl.value;
      const md: Moneda = this.monedaDestinoControl.value;
      if (mo && md && mo.id !== md.id && cot && cot > 0) {
        this.montoDestinoControl.setValue(this.round(!!(mo as any).principal ? monto / cot : monto * cot, md));
      } else if (monto != null) {
        this.montoDestinoControl.setValue(monto);
      }
      return;
    }

    if (tipo !== TipoOperacionFinanciera.CAMBIO_DIVISA) {
      if (monto != null) this.montoDestinoControl.setValue(monto); // misma moneda
      return;
    }
    const monOrigen: Moneda = this.monedaOrigenControl.value;
    const monDestino: Moneda = this.monedaDestinoControl.value;
    if (monto == null || !cot || cot <= 0 || !monOrigen) return;
    const origenEsPrincipal = !!(monOrigen as any).principal;
    const destino = origenEsPrincipal ? monto / cot : monto * cot;
    this.montoDestinoControl.setValue(this.round(destino, monDestino));
  }

  private round(valor: number, moneda: Moneda | null): number {
    const dec = moneda?.decimales != null ? moneda.decimales : (this.esGuarani(moneda) ? 0 : 2);
    const f = Math.pow(10, dec);
    return Math.round(valor * f) / f;
  }

  onSave() {
    if (this.formGroup.invalid) return;
    const tipo: TipoOperacionFinanciera = this.tipoOperacionControl.value;

    if (this.mostrarCajaOrigen && !this.cajaMayorOrigenControl.value) return this.err('Seleccione la caja mayor de origen');
    if (this.mostrarCuentaOrigen && !this.cuentaBancariaOrigenControl.value) return this.err('Seleccione la cuenta bancaria de origen');
    if (this.mostrarCajaDestino && !this.cajaMayorDestinoControl.value) return this.err('Seleccione la caja mayor de destino');
    if (this.mostrarCuentaDestino && !this.cuentaBancariaDestinoControl.value) return this.err('Seleccione la cuenta bancaria de destino');
    if (!this.monedaOrigenControl.value) return this.err('Falta la moneda de origen');
    if (!this.monedaDestinoControl.value) return this.err('Falta la moneda de destino');
    if (!this.montoOrigenControl.value || this.montoOrigenControl.value <= 0) return this.err('Ingrese un monto de origen válido');
    if (!this.montoDestinoControl.value || this.montoDestinoControl.value <= 0) return this.err('Ingrese un monto de destino válido');
    if (this.mostrarCotizacion && (!this.cotizacionControl.value || this.cotizacionControl.value <= 0)) return this.err('Ingrese la cotización');

    // Depósito y transferencia entre cajas deben ir en la misma moneda a ambos lados.
    const mismaMonedaTipos = [TipoOperacionFinanciera.DEPOSITO_BANCARIO, TipoOperacionFinanciera.RETIRO_BANCARIO, TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS];
    if (mismaMonedaTipos.includes(tipo) && this.monedaOrigenControl.value?.id !== this.monedaDestinoControl.value?.id) {
      return this.err('El origen y el destino deben estar en la misma moneda');
    }

    const operacion = new OperacionFinanciera();
    operacion.tipoOperacion = tipo;
    operacion.categoria = this.categoriaControl.value;
    operacion.descripcion = this.descripcionControl.value;
    operacion.numeroComprobante = this.numeroComprobanteControl.value;
    operacion.cajaMayorOrigen = this.mostrarCajaOrigen ? this.cajaMayorOrigenControl.value : null;
    operacion.cuentaBancariaOrigen = this.mostrarCuentaOrigen ? this.cuentaBancariaOrigenControl.value : null;
    operacion.monedaOrigen = this.monedaOrigenControl.value;
    operacion.montoOrigen = this.montoOrigenControl.value;
    operacion.cajaMayorDestino = this.mostrarCajaDestino ? this.cajaMayorDestinoControl.value : null;
    operacion.cuentaBancariaDestino = this.mostrarCuentaDestino ? this.cuentaBancariaDestinoControl.value : null;
    operacion.monedaDestino = this.monedaDestinoControl.value;
    operacion.montoDestino = this.montoDestinoControl.value;
    operacion.cotizacion = this.cotizacionControl.value;
    if (this.mostrarDiferencia && this.diferenciaControl.value) {
      operacion.diferencia = this.diferenciaControl.value;
      operacion.diferenciaDestinoTipo = this.diferenciaDestinoTipoControl.value;
      operacion.diferenciaObservacion = this.diferenciaObservacionControl.value;
    }

    this.isSaving = true;
    this.operacionFinancieraService.onRegistrar(operacion)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res != null) {
            this.notificacion.openSucess('Operación financiera registrada correctamente');
            this.dialogRef.close(res);
          }
        },
        error: err => {
          this.isSaving = false;
          const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Error al registrar la operación financiera';
          this.notificacion.openWarn(msg, 6);
        }
      });
  }

  private err(msg: string) {
    this.notificacion.openAlgoSalioMal(msg);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
