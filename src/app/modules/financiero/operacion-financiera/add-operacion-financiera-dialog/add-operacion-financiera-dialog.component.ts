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
import { CambioService } from '../../cambio/cambio.service';
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
  /** Trae la cotización del sistema en vez de escribirla a mano. Apagado por defecto. */
  cotizacionAutomaticaControl = new FormControl(false);

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

  // En el cambio de divisa cada lado puede salir de una caja mayor o de una cuenta bancaria:
  // los cambios entre cuentas son tan comunes como los de mostrador.
  fuenteOrigen: 'CAJA' | 'CUENTA' = 'CAJA';
  fuenteDestino: 'CAJA' | 'CUENTA' = 'CAJA';
  mostrarSelectorFuente = false;

  // Cotización: de dónde salió la que está cargada, para que no sea un número sin origen.
  cotizacionOrigenLabel = '';
  cotizacionLabel = 'Cotización (Gs por 1 de divisa)';
  buscandoCotizacion = false;

  // Monto único (misma moneda a ambos lados) vs. montos separados (cambio divisa / transf. bancaria).
  mostrarMontoDestino = false;
  labelMontoOrigen = 'Monto';
  // Orden visual de los bloques (depósito muestra el banco destino antes que la caja origen).
  ordenOrigen = 1;
  ordenDestino = 2;

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
    private cambioService: CambioService,
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
      cotizacionAutomaticaControl: this.cotizacionAutomaticaControl,
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

    // Cálculo bidireccional de montos vía la cotización: tipeando el origen se calcula el
    // destino y viceversa. Usa valueChanges (no el (input) del currencyMask, que llega con el
    // valor sin propagar) con un guard de reentrada para no entrar en bucle.
    this.montoOrigenControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.ajustandoMontos) return;
      this.registrarToque('origen');
      this.recalcular();
    });
    this.montoDestinoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.ajustandoMontos) return;
      this.registrarToque('destino');
      this.recalcular();
    });
    // La cotización escuchaba (input) del DOM, que no pasaba por el guard: como tercer
    // participante del motor tiene que entrar por el mismo camino que los montos.
    this.cotizacionControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.ajustandoMontos) return;
      this.registrarToque('cotizacion');
      this.cotizacionOrigenLabel = this.cotizacionAutomaticaControl.value ? this.cotizacionOrigenLabel : '';
      this.recalcular();
    });

    this.seleccionarTipo(TipoOperacionFinanciera.CAMBIO_DIVISA);
  }

  private ajustandoMontos = false;
  private setSilencioso(ctrl: FormControl, val: number) {
    this.ajustandoMontos = true;
    ctrl.setValue(val);
    this.ajustandoMontos = false;
  }

  /**
   * Motor de los tres campos: monto origen, monto destino y cotización.
   *
   * Cualquier par determina el tercero, y el operador no siempre tiene los mismos dos: a veces
   * conoce la tasa y el monto que entrega, y a veces solo el ticket de la casa de cambio, que
   * dice cuánto entregó y cuánto recibió. Antes solo se podía calcular hacia adelante desde la
   * cotización, así que en ese segundo caso había que sacar la división a mano.
   *
   * Manda el par de los dos últimos campos tocados; el tercero se deriva. Alcanza con recordar
   * cuál es el actual y cuál el anterior — mientras se sigue tipeando en el MISMO campo no se
   * rota nada, si no cada tecla desplazaría el par y se perdería la referencia.
   */
  private campoActual: 'origen' | 'destino' | 'cotizacion' = 'cotizacion';
  private campoAnterior: 'origen' | 'destino' | 'cotizacion' = 'destino';

  private registrarToque(campo: 'origen' | 'destino' | 'cotizacion') {
    if (this.campoActual === campo) return;
    this.campoAnterior = this.campoActual;
    this.campoActual = campo;
  }

  /** El campo que no está en el par de los dos últimos tocados: ese es el que se calcula. */
  private campoDerivado(): 'origen' | 'destino' | 'cotizacion' {
    const todos: ('origen' | 'destino' | 'cotizacion')[] = ['origen', 'destino', 'cotizacion'];
    return todos.find(c => c !== this.campoActual && c !== this.campoAnterior);
  }

  /**
   * Recalcula el campo derivado a partir de los otros dos.
   *
   * La cotización se expresa en unidades de la moneda NO principal: si un lado es guaraní, es
   * "Gs por 1 de la divisa". Cuando ninguno de los dos lados es la moneda principal (USD→BRL),
   * esa definición no aplica y pasa a ser "cuánto destino por 1 de origen" — el label cambia
   * junto con la fórmula para que el número no signifique dos cosas distintas.
   */
  private recalcular() {
    const tipo = this.tipoOperacionControl.value;
    if (tipo !== TipoOperacionFinanciera.CAMBIO_DIVISA) return this.recalcularNoDivisa();

    const mo: Moneda = this.monedaOrigenControl.value;
    const md: Moneda = this.monedaDestinoControl.value;
    if (!mo || !md) return;

    const origen = this.montoOrigenControl.value;
    const destino = this.montoDestinoControl.value;
    const cot = this.cotizacionControl.value;
    const origenEsBase = !!(mo as any).principal;
    const destinoEsBase = !!(md as any).principal;

    switch (this.campoDerivado()) {
      case 'destino':
        if (origen == null || !cot || cot <= 0) return;
        this.setSilencioso(this.montoDestinoControl,
          this.round(origenEsBase ? origen / cot : origen * cot, md));
        return;
      case 'origen':
        if (destino == null || !cot || cot <= 0) return;
        this.setSilencioso(this.montoOrigenControl,
          this.round(origenEsBase ? destino * cot : destino / cot, mo));
        return;
      case 'cotizacion':
        // No se pisa la cotización del sistema con una calculada de los montos.
        if (this.cotizacionAutomaticaControl.value) return;
        if (!origen || !destino || origen <= 0 || destino <= 0) return;
        this.setSilencioso(this.cotizacionControl,
          this.redondearCotizacion(origenEsBase || !destinoEsBase ? origen / destino : destino / origen));
        this.cotizacionOrigenLabel = 'calculada de los montos';
        return;
    }
  }

  /** Fuera del cambio de divisa el destino espeja al origen (o lo convierte, en transf. bancaria). */
  private recalcularNoDivisa() {
    const tipo = this.tipoOperacionControl.value;
    const monto = this.montoOrigenControl.value;
    const cot = this.cotizacionControl.value;
    const mo: Moneda = this.monedaOrigenControl.value;
    const md: Moneda = this.monedaDestinoControl.value;

    if (tipo === TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA) {
      if (mo && md && mo.id !== md.id && cot && cot > 0 && monto != null) {
        this.setSilencioso(this.montoDestinoControl,
          this.round(!!(mo as any).principal ? monto / cot : monto * cot, md));
      } else if (monto != null) {
        this.setSilencioso(this.montoDestinoControl, monto);
      }
      return;
    }
    if (monto != null) this.setSilencioso(this.montoDestinoControl, monto);
  }

  private redondearCotizacion(valor: number): number {
    return Math.round(valor * 1000000) / 1000000;
  }

  seleccionarTipo(tipo: TipoOperacionFinanciera) {
    this.tipoOperacionControl.setValue(tipo);
    this.onTipoOperacionChange();
  }

  onTipoOperacionChange() {
    const tipo = this.tipoOperacionControl.value;
    this.tituloActual = (this.tipoOperacionList.find(t => t.value === tipo)?.label) || 'Operación Financiera';

    const esCambio = tipo === TipoOperacionFinanciera.CAMBIO_DIVISA;
    // Solo el cambio de divisa deja elegir la fuente de cada lado; el resto de los tipos la
    // tienen implícita en su definición (un depósito siempre sale de una caja, etc.).
    this.mostrarSelectorFuente = esCambio;
    if (esCambio) { this.fuenteOrigen = 'CAJA'; this.fuenteDestino = 'CAJA'; }

    this.mostrarCajaOrigen = esCambio
      ? this.fuenteOrigen === 'CAJA'
      : [TipoOperacionFinanciera.DEPOSITO_BANCARIO, TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS].includes(tipo);
    this.mostrarCuentaOrigen = esCambio
      ? this.fuenteOrigen === 'CUENTA'
      : [TipoOperacionFinanciera.RETIRO_BANCARIO, TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA].includes(tipo);
    this.mostrarCajaDestino = esCambio
      ? this.fuenteDestino === 'CAJA'
      : [TipoOperacionFinanciera.RETIRO_BANCARIO, TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS].includes(tipo);
    this.mostrarCuentaDestino = esCambio
      ? this.fuenteDestino === 'CUENTA'
      : [TipoOperacionFinanciera.DEPOSITO_BANCARIO, TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA].includes(tipo);
    this.mostrarCotizacion = tipo === TipoOperacionFinanciera.CAMBIO_DIVISA;
    // La diferencia (sobra/falta por redondeo) solo tiene sentido en el cambio de divisa;
    // el resto de las operaciones se mantienen mínimas.
    // La diferencia se imputa como AJUSTE en una caja mayor: entre dos cuentas no hay dónde.
    this.mostrarDiferencia = esCambio && (this.fuenteOrigen === 'CAJA' || this.fuenteDestino === 'CAJA');

    // Moneda editable cuando NO se deriva de una cuenta bancaria: el usuario elige la
    // moneda de la caja en cambio de divisa (ambos lados) y en transferencia entre cajas
    // (origen; el destino la espeja). En depósito/retiro/transf. bancaria se autoselecciona del banco.
    // Si el lado es una cuenta bancaria, la moneda la manda la cuenta: no se elige.
    this.monedaOrigenEditable = (esCambio && this.fuenteOrigen === 'CAJA')
      || tipo === TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS;
    this.monedaDestinoEditable = esCambio && this.fuenteDestino === 'CAJA';

    // Monto separado solo cuando origen y destino pueden diferir de monto/moneda.
    this.mostrarMontoDestino = tipo === TipoOperacionFinanciera.CAMBIO_DIVISA
      || tipo === TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA;
    this.labelMontoOrigen = this.mostrarMontoDestino ? 'Monto Origen' : 'Monto';

    // Depósito bancario: primero se elige el banco (destino), luego la caja (origen).
    const destinoPrimero = tipo === TipoOperacionFinanciera.DEPOSITO_BANCARIO;
    this.ordenOrigen = destinoPrimero ? 2 : 1;
    this.ordenDestino = destinoPrimero ? 1 : 2;

    // Limpiar todo lo que no aplica.
    this.limpiarCampos();

    this.aplicarEstadoMoneda();
    this.actualizarCurrencyOpts();
  }

  /**
   * Limpia el formulario sin que cuente como edición del usuario.
   *
   * Los `setValue` disparan `valueChanges` igual, así que si no se silencian, cambiar de tipo
   * de operación deja el motor creyendo que el usuario tocó los tres campos.
   */
  private limpiarCampos() {
    this.ajustandoMontos = true;
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
    this.ajustandoMontos = false;
    this.cotizacionAutomaticaControl.setValue(false, { emitEvent: false });
    this.cotizacionOrigenLabel = '';
    this.campoActual = 'cotizacion';
    this.campoAnterior = 'destino';
  }

  /** Cambia la fuente de un lado del cambio de divisa entre caja mayor y cuenta bancaria. */
  onFuenteChange(lado: 'ORIGEN' | 'DESTINO', fuente: 'CAJA' | 'CUENTA') {
    if (lado === 'ORIGEN') {
      this.fuenteOrigen = fuente;
      this.ajustandoMontos = true;
      this.cajaMayorOrigenControl.setValue(null);
      this.cuentaBancariaOrigenControl.setValue(null);
      this.monedaOrigenControl.setValue(null);
      this.ajustandoMontos = false;
    } else {
      this.fuenteDestino = fuente;
      this.ajustandoMontos = true;
      this.cajaMayorDestinoControl.setValue(null);
      this.cuentaBancariaDestinoControl.setValue(null);
      this.monedaDestinoControl.setValue(null);
      this.ajustandoMontos = false;
    }
    this.recalcularVisibilidadLados();
  }

  /** Recalcula qué selector se muestra por lado sin reiniciar todo el formulario. */
  private recalcularVisibilidadLados() {
    this.mostrarCajaOrigen = this.fuenteOrigen === 'CAJA';
    this.mostrarCuentaOrigen = this.fuenteOrigen === 'CUENTA';
    this.mostrarCajaDestino = this.fuenteDestino === 'CAJA';
    this.mostrarCuentaDestino = this.fuenteDestino === 'CUENTA';
    this.monedaOrigenEditable = this.fuenteOrigen === 'CAJA';
    this.monedaDestinoEditable = this.fuenteDestino === 'CAJA';
    this.mostrarDiferencia = this.fuenteOrigen === 'CAJA' || this.fuenteDestino === 'CAJA';
    this.aplicarEstadoMoneda();
    this.actualizarEtiquetaCotizacion();
  }

  /**
   * El label de la cotización tiene que decir qué mide.
   *
   * Con guaraní de un lado es "Gs por 1 de divisa". Entre dos divisas extranjeras (USD→BRL) no
   * hay guaraní en el medio y el número pasa a ser "cuánto destino por 1 de origen": mismo campo,
   * otra unidad. Antes el label decía siempre Gs y la fórmula asumía lo mismo, así que ese caso
   * calculaba mal y en silencio.
   */
  private actualizarEtiquetaCotizacion() {
    const mo: Moneda = this.monedaOrigenControl.value;
    const md: Moneda = this.monedaDestinoControl.value;
    const hayBase = !!(mo as any)?.principal || !!(md as any)?.principal;
    this.cotizacionLabel = hayBase || !mo || !md
      ? 'Cotización (Gs por 1 de divisa)'
      : `Cotización (${md?.simbolo || md?.denominacion} por 1 ${mo?.simbolo || mo?.denominacion})`;
  }

  /**
   * Trae la cotización del sistema según el sentido de la operación.
   *
   * Comprar y vender no cotizan igual: si la divisa extranjera ENTRA (está en el destino), la
   * empresa la está comprando; si SALE, la está vendiendo. Antes se usaba siempre la de compra,
   * y además se precargaba sola al elegir cada moneda, pisando lo que el usuario hubiera escrito.
   */
  onCotizacionAutomaticaChange() {
    if (!this.cotizacionAutomaticaControl.value) {
      this.cotizacionOrigenLabel = '';
      return;
    }
    const mo: Moneda = this.monedaOrigenControl.value;
    const md: Moneda = this.monedaDestinoControl.value;
    if (!mo || !md) {
      this.cotizacionAutomaticaControl.setValue(false, { emitEvent: false });
      return this.notificacion.openAlgoSalioMal('Elegí las dos monedas antes de traer la cotización');
    }

    // La divisa a cotizar es la que no es la moneda base. Entre dos extranjeras no hay una sola
    // cotización que sirva (harían falta las dos contra el guaraní), así que se carga a mano.
    const origenEsBase = !!(mo as any).principal;
    const destinoEsBase = !!(md as any).principal;
    if (!origenEsBase && !destinoEsBase) {
      this.cotizacionAutomaticaControl.setValue(false, { emitEvent: false });
      return this.notificacion.openAlgoSalioMal(
        'Entre dos divisas extranjeras no hay una cotización del sistema: cargala a mano');
    }

    const extranjera = origenEsBase ? md : mo;
    // Extranjera en el destino = entra a la empresa = la empresa compra.
    const compramos = !destinoEsBase;
    this.buscandoCotizacion = true;
    this.cambioService.getUltimoCambioPorMonedaId(extranjera.id)
      .pipe(untilDestroyed(this))
      .subscribe(c => {
        this.buscandoCotizacion = false;
        const tasa = compramos
          ? ((c as any)?.valorEnGsCompraMercado ?? (c as any)?.valorEnGsCambio ?? (c as any)?.valorEnGs)
          : ((c as any)?.valorEnGsVentaMercado ?? (c as any)?.valorEnGsCambio ?? (c as any)?.valorEnGs);
        if (!tasa || tasa <= 0) {
          this.cotizacionAutomaticaControl.setValue(false, { emitEvent: false });
          this.cotizacionOrigenLabel = '';
          return this.notificacion.openAlgoSalioMal(
            `No hay cotización cargada para ${extranjera.denominacion}: cargala a mano`);
        }
        this.cotizacionOrigenLabel = compramos ? 'compra de mercado' : 'venta de mercado';
        // Entra como un toque de cotización: los montos se recalculan a partir de ella.
        this.registrarToque('cotizacion');
        this.setSilencioso(this.cotizacionControl, tasa);
        this.recalcular();
      });
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
    this.actualizarEtiquetaCotizacion();
    this.recalcular();
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
    this.actualizarEtiquetaCotizacion();
    this.recalcular();
  }

  /** Resuelve la moneda completa (con principal/decimales) desde monedaList por id. */
  private resolverMoneda(m: Moneda | null | undefined): Moneda | null {
    if (!m) return null;
    return this.monedaList.find(x => x.id === m.id) || m;
  }

  /** Elegir la caja no cambia montos, pero sí habilita el cálculo cuando ya hay monedas. */
  onCajaChange() {
    this.recalcular();
  }

  /** Cambio de moneda de la caja origen (solo cambio de divisa o transf. entre cajas). */
  onMonedaOrigenChange() {
    const tipo = this.tipoOperacionControl.value;
    // Transferencia entre cajas: misma moneda a ambos lados.
    if (tipo === TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS) {
      this.monedaDestinoControl.setValue(this.monedaOrigenControl.value);
    }
    this.actualizarCurrencyOpts();
    this.actualizarEtiquetaCotizacion();
    this.recalcular();
  }

  onMonedaDestinoChange() {
    this.actualizarCurrencyOpts();
    this.actualizarEtiquetaCotizacion();
    this.recalcular();
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

  private round(valor: number, moneda: Moneda | null): number {
    const dec = moneda?.decimales != null ? moneda.decimales : (this.esGuarani(moneda) ? 0 : 2);
    const f = Math.pow(10, dec);
    return Math.round(valor * f) / f;
  }

  onSave() {
    if (this.formGroup.invalid) return;
    const tipo: TipoOperacionFinanciera = this.tipoOperacionControl.value;

    // Operaciones de monto único (depósito/retiro/transf. entre cajas): el destino espeja al
    // origen. Se fuerza acá porque el (input) del currencyMask puede no haber propagado aún.
    if (!this.mostrarMontoDestino) {
      this.montoDestinoControl.setValue(this.montoOrigenControl.value);
    }

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
        error: () => {
          // Solo se libera el formulario: el mensaje ya lo mostró GenericCrudService y
          // repetirlo acá deja dos snackbars encimados diciendo lo mismo.
          this.isSaving = false;
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
