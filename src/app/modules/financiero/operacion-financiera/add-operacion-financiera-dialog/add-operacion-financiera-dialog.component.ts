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
  montoOrigenControl = new FormControl(null, Validators.min(0.01));

  cajaMayorDestinoControl = new FormControl(null);
  cuentaBancariaDestinoControl = new FormControl(null);
  monedaDestinoControl = new FormControl(null);
  montoDestinoControl = new FormControl(null, Validators.min(0.01));

  cotizacionControl = new FormControl(null);

  // Diferencia (sobra/falta al cerrar la operación)
  diferenciaControl = new FormControl(null);
  diferenciaDestinoTipoControl = new FormControl(DiferenciaDestinoTipo.IGNORAR);
  diferenciaObservacionControl = new FormControl('');

  tipoOperacionList = [
    { label: 'Cambio de Divisa', value: TipoOperacionFinanciera.CAMBIO_DIVISA, icono: 'currency_exchange' },
    { label: 'Depósito Bancario', value: TipoOperacionFinanciera.DEPOSITO_BANCARIO, icono: 'account_balance' },
    { label: 'Retiro Bancario', value: TipoOperacionFinanciera.RETIRO_BANCARIO, icono: 'savings' },
    { label: 'Transferencia entre Cajas', value: TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS, icono: 'swap_horiz' },
    { label: 'Transferencia Bancaria', value: TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA, icono: 'sync_alt' },
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

  // Flags de visibilidad — calculados en TS al cambiar el tipo, NUNCA en el HTML.
  mostrarCajaOrigen = false;
  mostrarCuentaOrigen = false;
  mostrarCajaDestino = false;
  mostrarCuentaDestino = false;
  mostrarCotizacion = false;
  mostrarDiferencia = true;

  selectedTabIndex = 0;
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

    // Solo cuentas propias operables en tesorería (no cuentas de terceros).
    this.cuentaBancariaService.onGetAllOperables().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.cuentaBancariaList = res;
    });

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.monedaList = res;
    });

    this.onTipoOperacionChange();
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    const opt = this.tipoOperacionList[index];
    if (opt) {
      this.tipoOperacionControl.setValue(opt.value);
      this.onTipoOperacionChange();
    }
  }

  onTipoOperacionChange() {
    const tipo = this.tipoOperacionControl.value;

    this.mostrarCajaOrigen = [
      TipoOperacionFinanciera.CAMBIO_DIVISA,
      TipoOperacionFinanciera.DEPOSITO_BANCARIO,
      TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS
    ].includes(tipo);

    this.mostrarCuentaOrigen = [
      TipoOperacionFinanciera.RETIRO_BANCARIO,
      TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA
    ].includes(tipo);

    this.mostrarCajaDestino = [
      TipoOperacionFinanciera.CAMBIO_DIVISA,
      TipoOperacionFinanciera.RETIRO_BANCARIO,
      TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS
    ].includes(tipo);

    this.mostrarCuentaDestino = [
      TipoOperacionFinanciera.DEPOSITO_BANCARIO,
      TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA
    ].includes(tipo);

    this.mostrarCotizacion = tipo === TipoOperacionFinanciera.CAMBIO_DIVISA;
    // La diferencia se imputa a una caja mayor; TRANSFERENCIA_BANCARIA no toca caja.
    this.mostrarDiferencia = tipo !== TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA;

    if (!this.mostrarCajaOrigen) this.cajaMayorOrigenControl.setValue(null);
    if (!this.mostrarCuentaOrigen) this.cuentaBancariaOrigenControl.setValue(null);
    if (!this.mostrarCajaDestino) this.cajaMayorDestinoControl.setValue(null);
    if (!this.mostrarCuentaDestino) this.cuentaBancariaDestinoControl.setValue(null);
    if (!this.mostrarCotizacion) this.cotizacionControl.setValue(null);
    if (!this.mostrarDiferencia) {
      this.diferenciaControl.setValue(null);
      this.diferenciaDestinoTipoControl.setValue(DiferenciaDestinoTipo.IGNORAR);
    }
  }

  // La caja mayor maneja Gs/R$/US$ en simultáneo; al elegir caja el usuario elige la moneda.
  // Al elegir cuenta bancaria autocompletamos la moneda (la cuenta es de una sola moneda).
  onCuentaOrigenChange() {
    const cuenta: CuentaBancaria = this.cuentaBancariaOrigenControl.value;
    if (cuenta?.moneda) {
      this.monedaOrigenControl.setValue(cuenta.moneda);
      // Depósito/retiro: ambos lados comparten la moneda de la cuenta.
      this.monedaDestinoControl.setValue(cuenta.moneda);
    }
    this.recalcularMontoDestino();
  }

  onCuentaDestinoChange() {
    const cuenta: CuentaBancaria = this.cuentaBancariaDestinoControl.value;
    if (cuenta?.moneda) {
      this.monedaDestinoControl.setValue(cuenta.moneda);
      this.monedaOrigenControl.setValue(cuenta.moneda);
    }
    this.recalcularMontoDestino();
  }

  /** Recalcula montoDestino según cotización (moneda principal por 1 unidad de divisa). */
  recalcularMontoDestino() {
    const monto = this.montoOrigenControl.value;
    const cot = this.cotizacionControl.value;
    const tipo = this.tipoOperacionControl.value;

    if (tipo !== TipoOperacionFinanciera.CAMBIO_DIVISA) {
      // Sin cambio de moneda: destino = origen.
      if (monto != null) this.montoDestinoControl.setValue(monto);
      return;
    }
    const monOrigen: Moneda = this.monedaOrigenControl.value;
    if (monto == null || !cot || cot <= 0 || !monOrigen) return;
    // cotización = cuánto de la moneda PRINCIPAL vale 1 unidad de la divisa extranjera.
    // Si origen es la principal (Gs -> USD): dividir. Si destino es principal (USD -> Gs): multiplicar.
    const origenEsPrincipal = !!(monOrigen as any).principal;
    const destino = origenEsPrincipal ? monto / cot : monto * cot;
    this.montoDestinoControl.setValue(Math.round(destino * 100) / 100);
  }

  onSave() {
    if (this.formGroup.invalid) return;
    const tipo: TipoOperacionFinanciera = this.tipoOperacionControl.value;

    if (this.mostrarCajaOrigen && !this.cajaMayorOrigenControl.value) return this.err('Seleccione la caja mayor de origen');
    if (this.mostrarCuentaOrigen && !this.cuentaBancariaOrigenControl.value) return this.err('Seleccione la cuenta bancaria de origen');
    if (this.mostrarCajaDestino && !this.cajaMayorDestinoControl.value) return this.err('Seleccione la caja mayor de destino');
    if (this.mostrarCuentaDestino && !this.cuentaBancariaDestinoControl.value) return this.err('Seleccione la cuenta bancaria de destino');
    if (!this.montoOrigenControl.value || !this.montoDestinoControl.value) return this.err('Debe ingresar el monto de origen y de destino');
    if (this.mostrarCotizacion && !this.cotizacionControl.value) return this.err('Ingrese la cotización');
    if ((this.mostrarCajaOrigen || this.mostrarCuentaOrigen) && !this.monedaOrigenControl.value) return this.err('Seleccione la moneda de origen');
    if ((this.mostrarCajaDestino || this.mostrarCuentaDestino) && !this.monedaDestinoControl.value) return this.err('Seleccione la moneda de destino');

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
