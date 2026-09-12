import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, filter, map } from 'rxjs/operators';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { VentaTarjetaService } from '../../venta-tarjeta.service';
import { CapturaCuponService } from '../../captura-cupon/captura-cupon.service';
import { CapturaCupon, parsearCampos } from '../../captura-cupon/captura-cupon.model';
import { TIPO_WEB } from '../formato-terminal-pos/formato-terminal-pos.model';
import { CargaManualCuponDialogComponent } from '../carga-manual-cupon-dialog/carga-manual-cupon-dialog.component';
import { FormatoQrPosService } from '../formato-qr-pos.service';
import { DatosCupon, FormatoQrPos } from '../formato-qr-pos.model';
import {
  DecimalesPorMoneda,
  formatoCruzado,
  MAX_LONGITUD_QR,
  ordenarPorProveedor,
  parsearCupon,
} from '../qr-pos-parser';

export interface EscanearCuponDialogData {
  terminalDescripcion?: string;
  proveedorServicioId?: number;
  /**
   * Formato del modelo de aparato de la terminal elegida. De acá sale el tipo, que decide **qué
   * camino se le ofrece al cajero y cuál se le cierra**.
   *
   * `null` = la terminal no tiene formato configurado, y entonces no hay forma de leer su cupón.
   */
  formatoTerminalPos?: { id?: number; nombre?: string; tipo?: string; mapeo?: string };
  monto: number;
  /**
   * Moneda del COBRO — la de la línea que se está pagando, no la de la terminal. El monto que se
   * muestra sale del cobro, así que su símbolo tiene que salir de ahí también: pegarle el símbolo
   * de la terminal mostraba "8.000 R$" para un cobro de 8.000 Gs.
   */
  monedaCobroId?: number;
  monedaSimbolo?: string;
  /** Moneda configurada en la terminal. Si difiere de la del cobro, se avisa antes de escanear. */
  monedaTerminalId?: number;
  monedaTerminalSimbolo?: string;
  decimalesPorMoneda?: DecimalesPorMoneda;
  /** Necesaria para preguntarle al filial si el cupon ya fue usado. */
  sucursalId?: number;
  /** Caja abierta. Sin ella no se puede abrir una captura de foto: el token cuelga de la caja. */
  cajaId?: number;
  /** Queda registrado en la captura, para saber quién pidió la foto. */
  usuarioId?: number;
  /**
   * Terminal elegida. Va en la captura y es lo que convierte al OCR en extractor: con ella el
   * filial sabe qué formato aplicar y devuelve los campos separados en vez de texto crudo.
   */
  terminalPosId?: number;
  /**
   * Si en ESTA terminal se puede tipear el cupón a mano. `null`/`undefined` = hereda la
   * configuración general, que hoy es permitirlo.
   *
   * Apagarlo sólo es seguro porque el backend **rechaza** hacerlo cuando es el último camino que
   * le queda a esa caja: sin formato, o con un formato cuyo driver no existe. Esa validación es la
   * que hace aceptable que acá se esconda el botón.
   */
  cargaManualPermitida?: boolean;
}

/**
 * Paso previo a Finalizar: leer el cupón que el POS imprimió, sin tocar el backend.
 *
 * A diferencia del registro post-venta (RegistrarVentaTarjetaDialogComponent), acá NO hay
 * venta_tarjeta.id todavía — recién existe después de que la venta se guarde. Por eso este
 * diálogo solo parsea la cadena en memoria y devuelve el resultado; la escritura real
 * (crear + completar) la hace venta-touch en un solo golpe cuando la venta se guarda con éxito.
 * El QR de foto SÍ funciona acá, y no depende de eso: el token de captura lo emite el filial y
 * cuelga de la caja, no de la venta. Es el camino para los POS que no imprimen QR — el cajero
 * fotografía el cupón con cualquier teléfono y el OCR corre dentro del filial. Ver fase 2.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-escanear-cupon-dialog',
  templateUrl: './escanear-cupon-dialog.component.html',
  styleUrls: ['./escanear-cupon-dialog.component.scss'],
})
export class EscanearCuponDialogComponent implements OnInit {

  cuponControl = new FormControl('');
  formatos: FormatoQrPos[] = [];
  errorLectura: string = null;
  readonly maxLongitud = MAX_LONGITUD_QR;

  /**
   * Qué caminos ofrece el diálogo, decidido por el tipo del formato de la terminal.
   *
   * Campos y no getters: el repo prohíbe getters en bindings. Se calculan una vez, en el
   * constructor, porque la terminal ya viene elegida cuando este diálogo se abre.
   */
  ofreceLector = false;
  ofreceCamara = false;
  /** Motivo por el que no se puede leer el cupón acá. `null` = se puede. */
  bloqueo: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EscanearCuponDialogData,
    public dialogRef: MatDialogRef<EscanearCuponDialogComponent>,
    private formatoQrPosService: FormatoQrPosService,
    private matDialog: MatDialog,
    private ventaTarjetaService: VentaTarjetaService,
    private capturaCuponService: CapturaCuponService
  ) {
    this.decidirCaminos();
  }

  /**
   * Qué camino se le ofrece al cajero, y cuál se le CIERRA.
   *
   * Es la razón de ser del tipo de formato. Antes se ofrecían los dos siempre: en una maquinita
   * que no imprime QR el cajero se quedaba esperando frente al lector, y en un POS web podía
   * sacarle una foto a un cupón que ya traía los datos estructurados.
   *
   * <b>Cerrar un camino sólo es aceptable porque la carga a mano queda disponible para cualquier
   * tipo, siempre.</b> Si esa condición se rompe, hay que reabrir los caminos.
   */
  /**
   * Carga a mano: la salida universal.
   *
   * Acá la venta todavía no existe, así que el diálogo de carga NO completa contra el filial: sólo
   * devuelve los campos tipeados, y el PDV los guarda junto con la venta por el mismo camino por
   * el que guarda lo que sale del lector.
   */
  onCargarAMano(): void {
    this.matDialog
      .open(CargaManualCuponDialogComponent, {
        width: '520px',
        disableClose: false,
        data: {
          // Sin ventaTarjetaId: modo "devolver datos". Ver CargaManualCuponData.
          sucursalId: this.data.sucursalId,
          monto: this.data.monto,
          monedaId: this.data.monedaCobroId,
          monedaSimbolo: this.data.monedaSimbolo,
          terminalDescripcion: this.data.terminalDescripcion,
          mapeo: this.data.formatoTerminalPos?.mapeo,
          origen: 'MANUAL',
          // Si ya se saco una foto y el OCR no la pudo interpretar, la imagen igual queda atada a
          // la venta: el cupon sigue siendo la evidencia aunque el motor no lo haya leido. Sin
          // esto, la purga la trata como huerfana y borra la prueba de un cobro real.
          capturaToken: this.capturaToken,
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) this.dialogRef.close(res);
      });
  }

  private decidirCaminos(): void {
    // La configuración por aparato. `false` explícito es lo único que lo apaga: `null` significa
    // "hereda la general", que hoy es permitirlo.
    this.ofreceCargaManual = this.data?.cargaManualPermitida !== false;

    if (!this.data?.formatoTerminalPos) {
      this.ofreceLector = false;
      this.ofreceCamara = false;
      this.bloqueo =
        'Esta terminal no tiene formato configurado, así que el sistema no sabe cómo leer su ' +
        'cupón. Un administrador tiene que asignárselo en Financiero → Terminales POS.';
      return;
    }

    this.bloqueo = null;
    const tipo = this.data.formatoTerminalPos.tipo;
    if (tipo === TIPO_WEB) {
      this.ofreceLector = true;
      this.ofreceCamara = false;
    } else {
      // MAQUINA, y también cualquier tipo que este desktop no conozca: se cae a la cámara, que
      // sirve para cualquier cupón de papel, en vez de dejar la pantalla sin ninguna salida.
      this.ofreceLector = false;
      this.ofreceCamara = true;
    }
  }

  /**
   * Captura por foto: para las maquinitas que no imprimen QR.
   *
   * El desktop pide el token al filial, muestra la URL en un QR y espera. El teléfono no
   * necesita app, ni login, ni estar dado de alta: la página la sirve el propio filial por HTTP
   * en la LAN. Ver §2.7 y §2.8 de FASE-2-TICKET-FISICO.md.
   */
  capturaUrl: string = null;

  /**
   * Si se ofrece la carga a mano en esta terminal. Campo plano y no getter: el template lo bindea
   * y el repo prohíbe getters en bindings.
   */
  ofreceCargaManual = true;

  /** El QR ya se mostró y todavía no llegó una lectura buena. */
  esperandoFoto = false;

  /** Mientras se pide el token. Corto, pero el botón tiene que quedar inerte. */
  pidiendoCaptura = false;

  /**
   * Texto crudo del OCR.
   *
   * Sigue mostrándose, pero ahora es el **camino de respaldo**: cuando el filial pudo separar los
   * campos se abre la confirmación y esto queda de fondo. Se ve cuando la terminal no tiene
   * formato o el patrón no reconoció el cupón — que es exactamente como funcionaba el módulo antes
   * de esta etapa, o sea un piso conocido y no una regresión.
   */
  textoOcr: string = null;

  /** El token de la captura en curso. Viaja hasta `completar` para atar la foto a la venta. */
  private capturaToken: string = null;

  /** Lo que salió mal con la foto. No cancela la espera: el token sigue vivo y se reintenta. */
  errorCaptura: string = null;

  msOcr: number = null;

  /**
   * La terminal está configurada en otra moneda que el cobro: se avisa, no bloquea el escaneo.
   * Propiedad plana y no getter: el template la bindea, y el repo prohíbe getters en bindings
   * porque se reevalúan en cada ciclo de detección de cambios.
   */
  avisoMonedaTerminal = '';

  /** Mientras se consulta al filial si el cupon ya fue usado. */
  verificando = false;

  /**
   * Formato de `data.monto`, calculado una sola vez. Con un `1.0-2` fijo un cobro de 50,00 R$ se
   * mostraba como "50": el minimo de decimales es 0 y se comian los ceros. El cajero compara este
   * numero contra el ticket del POS en una pantalla donde tambien hay guaranies, asi que perder
   * los decimales invita a confundir la escala — justo el error que esta feature existe para
   * evitar. Se precalcula porque el template no puede llamar funciones ni getters.
   */
  digitosMonto = '1.0-2';

  ngOnInit(): void {
    const decimales = this.data.monedaCobroId != null
      ? this.data.decimalesPorMoneda?.[this.data.monedaCobroId]
      : undefined;
    if (decimales != null) this.digitosMonto = `1.${decimales}-${decimales}`;

    if (
      this.data.monedaTerminalId != null &&
      this.data.monedaCobroId != null &&
      Number(this.data.monedaTerminalId) !== Number(this.data.monedaCobroId)
    ) {
      this.avisoMonedaTerminal =
        `Esta terminal está configurada en ${this.data.monedaTerminalSimbolo || 'otra moneda'} ` +
        `y el cobro es en ${this.data.monedaSimbolo || 'Gs.'}.`;
    }

    this.formatoQrPosService.onGetActivos().pipe(untilDestroyed(this)).subscribe({
      next: (formatos) => (this.formatos = formatos || []),
      error: () => (this.formatos = []),
    });

    // Sin distinctUntilChanged a propósito: tras un cruce de proveedor, "Reintentar" limpia el
    // control con emitEvent:false (para no reprocesar el string vacío) — pero eso deja
    // "recordado" el último valor real que sí se emitió. Si el cajero vuelve a escanear
    // exactamente el mismo cupón (por ejemplo, porque en verdad SÍ era el correcto y confirma
    // igual), distinctUntilChanged lo descartaría en silencio y el diálogo quedaría sin
    // reaccionar. Reprocesar el mismo string dos veces es barato (una sola escaneada manual, no
    // un loop) y es el comportamiento esperado acá.
    this.cuponControl.valueChanges
      .pipe(
        map((v: string) => (v || '').trim()),
        filter((v: string) => v.length > 0),
        debounceTime(250),
        untilDestroyed(this)
      )
      .subscribe((cadena) => this.onCuponLeido(cadena));
  }

  private onCuponLeido(cadena: string): void {
    this.errorLectura = null;

    const ordenados = ordenarPorProveedor(this.formatos, this.data.proveedorServicioId);
    const resultado = parsearCupon(cadena, ordenados, this.data.decimalesPorMoneda || {});
    if (!resultado.ok) {
      this.errorLectura = resultado.error;
      return;
    }

    const datos = resultado.datos;

    // El cruce se chequea ANTES que cualquier otra advertencia: aceptar de más acá es peor que
    // preguntar de más, porque una vez que se completa no hay vuelta atrás fácil.
    // Moneda distinta = error, no advertencia. Comparar 8.000 Gs contra 8.000 R$ da diferencia
    // cero y el registro queda "conciliado" siendo que difiere ~5900x. No hay confirmación
    // posible: un cupón en otra moneda no paga este cobro.
    const monedaCobro = this.data.monedaCobroId;
    if (monedaCobro != null && datos.monedaId != null && Number(datos.monedaId) !== Number(monedaCobro)) {
      this.errorLectura =
        `El cupón está en otra moneda que este cobro (${this.data.monedaSimbolo || 'Gs.'}). ` +
        `No se puede usar para pagarlo.`;
      this.cuponControl.setValue('', { emitEvent: false });
      return;
    }

    // Cupon ya usado: bloqueo duro, y va ANTES del cruce porque los bloqueos preceden a las
    // confirmaciones. Se pregunta al filial en vez de esperar al guardado: detectarlo alli dejaba
    // al cajero enterandose con la venta ya registrada, el cupon descartado y el registro caido a
    // PENDIENTE — habia que volver a cargarlo desde la lista. Aca todavia tiene el ticket en la
    // mano.
    this.verificando = true;
    this.ventaTarjetaService
      .onMotivoCuponNoUsable(datos.qrCrudo, datos.identificadorTransaccion, Number(this.data.sucursalId))
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (motivo) => {
          this.verificando = false;
          if (motivo) {
            this.errorLectura = motivo;
            this.cuponControl.setValue('', { emitEvent: false });
            return;
          }
          this.continuarTrasChequeo(datos);
        },
        // Falla abierta a proposito: si no se pudo consultar (filial caido, red), NO se bloquea.
        // La validacion de verdad corre igual al guardar; impedir el escaneo porque no se pudo
        // preguntar seria peor que el problema que esto resuelve.
        error: () => {
          this.verificando = false;
          this.continuarTrasChequeo(datos);
        },
      });
  }

  private continuarTrasChequeo(datos: DatosCupon): void {
    if (formatoCruzado(datos.formato, this.data.proveedorServicioId)) {
      this.confirmarCruce(datos);
      return;
    }

    this.aceptar(datos);
  }

  private confirmarCruce(datos: DatosCupon): void {
    const data: ConfirmDialogData = {
      title: 'El cupón no parece ser de esta terminal',
      message:
        `El código coincide con el formato de otro proveedor, no con el de ${this.data.terminalDescripcion || 'esta terminal'}. ` +
        `¿Reintentar el escaneo o confirmar igual?`,
      confirmText: 'Confirmar igual',
      cancelText: 'Reintentar',
    };
    this.matDialog.open(ConfirmDialogComponent, { data, width: '480px' })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (confirmado) {
          this.aceptar(datos);
        } else {
          this.cuponControl.setValue('', { emitEvent: false });
        }
      });
  }

  private aceptar(datos: DatosCupon): void {
    this.dialogRef.close(datos);
  }

  // El aviso de monto distinto / cupón vencido no se muestra acá: en cuanto el parseo da bien,
  // el diálogo cierra en el mismo tick (aceptar() de abajo), así que no alcanzaría a verse. Lo
  // muestra pago-touch como snackbar apenas este diálogo cierra — ver escanearTarjeta().

  /**
   * Abre una captura y muestra el QR.
   *
   * Se queda escuchando hasta que llegue una lectura buena. Un ERROR se muestra pero NO corta la
   * espera: el token no se consume con una foto fallida, así que el cajero saca otra desde el
   * mismo teléfono sin volver a la caja.
   */
  onSacarFoto(): void {
    if (this.data.cajaId == null || this.data.sucursalId == null) {
      this.errorCaptura = 'No se puede sacar la foto sin una caja abierta.';
      return;
    }

    this.pidiendoCaptura = true;
    this.errorCaptura = null;
    this.textoOcr = null;

    this.capturaCuponService
      .onCrear(
        Number(this.data.cajaId),
        Number(this.data.sucursalId),
        this.data.usuarioId,
        this.data.terminalPosId
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (qr) => {
          this.pidiendoCaptura = false;
          if (!qr?.url) {
            this.errorCaptura = 'El filial no pudo abrir la captura. Probá de nuevo.';
            return;
          }
          this.capturaUrl = qr.url;
          this.esperandoFoto = true;
          this.capturaToken = qr.token;
          this.escucharCaptura(qr.token);
        },
        error: () => {
          this.pidiendoCaptura = false;
          this.errorCaptura = 'No se pudo abrir la captura. Revisá que el servidor de la sucursal esté funcionando.';
        },
      });
  }

  private escucharCaptura(token: string): void {
    this.capturaCuponService
      // La caja va como segundo argumento: el aviso ya no trae el token --difundirlo dejaba
      // que otra sesion del filial leyera este cupon-- asi que el filtro es por caja.
      .onEsperar(token, Number(this.data.cajaId))
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (c) => {
          if (c.estado === 'ERROR') {
            // Se sigue esperando a propósito: la foto se reintenta desde el teléfono.
            this.errorCaptura = c.error || 'No se pudo leer la foto. Sacá otra.';
            return;
          }
          this.errorCaptura = null;
          this.textoOcr = c.textoOcr;
          this.msOcr = c.msOcr;
          this.esperandoFoto = false;
          this.confirmarLectura(c);
        },
        error: () => {
          this.errorCaptura = 'Se perdió la conexión con el servidor de la sucursal.';
        },
      });
  }

  /**
   * El OCR terminó: si separó los campos, se abre la confirmación en vez de dejar al cajero
   * transcribiendo.
   *
   * <b>Es el punto de toda la etapa.</b> Hasta ahora la foto producía texto en pantalla y el
   * cajero lo copiaba igual: el OCR era una lupa. Ahora los campos vienen llenos y el trabajo es
   * confirmar los dudosos.
   *
   * Si no vinieron campos --terminal sin formato, patrón que no reconoce este cupón-- NO se abre
   * nada y queda el texto crudo a la vista, con el botón de carga a mano al lado. Es el
   * comportamiento anterior, o sea un piso conocido: degrada, no se rompe.
   */
  private confirmarLectura(c: CapturaCupon): void {
    const campos = parsearCampos(c.campos);
    if (!campos) return;

    // `datosExtra` y `confianzas` no son valores del formulario. Se sacan antes para que el
    // diálogo reciba sólo lo que puede precargar.
    const { datosExtra, confianzas, ...valores } = campos;
    if (!Object.keys(valores).some((k) => valores[k] != null && valores[k] !== '')) {
      // Matcheó pero no trajo ningún valor útil. Mejor el texto crudo que un formulario vacío
      // que parece que algo salió bien.
      return;
    }

    this.matDialog
      .open(CargaManualCuponDialogComponent, {
        width: '520px',
        disableClose: false,
        data: {
          // Sin ventaTarjetaId: acá la venta todavía no existe. Ver CargaManualCuponData.
          sucursalId: this.data.sucursalId,
          monto: this.data.monto,
          monedaId: this.data.monedaCobroId,
          monedaSimbolo: this.data.monedaSimbolo,
          terminalDescripcion: this.data.terminalDescripcion,
          mapeo: this.data.formatoTerminalPos?.mapeo,
          valores,
          confianzas,
          capturaToken: this.capturaToken,
          origen: 'OCR',
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        // Cancelar no cierra este diálogo: el cajero vuelve a ver el texto leído y puede sacar
        // otra foto o cargar a mano. El token sigue vivo.
        if (res) this.dialogRef.close(res);
      });
  }

  /** Vuelve al lector. La captura abierta se deja vencer sola: no hay nada que limpiar. */
  onVolverAlLector(): void {
    this.capturaUrl = null;
    this.esperandoFoto = false;
    this.textoOcr = null;
    this.errorCaptura = null;
  }

  onMasTarde(): void {
    this.dialogRef.close(null);
  }
}
