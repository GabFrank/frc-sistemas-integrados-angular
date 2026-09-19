import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { mensajeDeError } from '../mensaje-error';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../../notificacion-snackbar.service';
import { VentaTarjetaService } from '../../venta-tarjeta.service';

export interface CargaManualCuponData {
  /**
   * Registro PENDIENTE a completar.
   *
   * Si viene, el diálogo **completa** contra el filial y cierra devolviendo la venta. Si NO viene
   * --el caso del PDV, donde la venta todavía no se guardó-- el diálogo se limita a **devolver los
   * campos tipeados** y quien lo abrió los guarda junto con la venta. Son los dos momentos en que
   * un cupón se puede cargar, y el formulario es el mismo.
   */
  ventaTarjetaId?: number;
  sucursalId: number;
  /** Cobro al que pertenece el cupón, si el llamador ya lo sabe. */
  cobroDetalleId?: number;
  /** Moneda del cobro. El backend rechaza un cupón en otra moneda. */
  monedaId?: number;
  monedaSimbolo?: string;
  /** Monto cobrado, para que el cajero pueda contrastarlo con lo que tipea. */
  monto?: number;
  terminalDescripcion?: string;
  /** `mapeo` del formato de la terminal. De acá salen los campos obligatorios. */
  mapeo?: string;

  /**
   * Lo que el OCR ya leyó, para precargar el formulario. Las claves son las canónicas del cupón
   * (`monto`, no `montoEscaneado`).
   *
   * Cuando viene, este diálogo deja de ser "cargá todo a mano" y pasa a ser "confirmá esto". Es
   * la diferencia de fricción que justifica toda la etapa.
   */
  valores?: { [clave: string]: any };

  /**
   * Confianza 0..1 por campo canónico, del OCR.
   *
   * **Un campo que no está acá es un campo del que no se sabe**, y se trata igual que uno de
   * confianza baja: hay que confirmarlo. Son distintos motivos para preguntar, misma acción.
   */
  confianzas?: { [campo: string]: number };

  /**
   * Token de la captura que produjo estos datos. Viaja hasta `completar` para que la foto quede
   * atada a la venta: es lo que después impide que la purga se lleve puesta la evidencia de un
   * cobro.
   */
  capturaToken?: string;

  /** De dónde salieron los datos. Sin esto, `venta_tarjeta.origen` queda nulo. */
  origen?: 'QR' | 'OCR' | 'MANUAL';

  /**
   * Los campos que el cupón trae y que no tienen columna propia, como JSON.
   *
   * No se muestran en el formulario —no hay dónde— pero **sí se guardan**: son los campos propios
   * del proveedor que `venta_tarjeta.datos_extra` existe para conservar.
   */
  datosExtra?: string;

  /**
   * Cuánto puede diferir el monto del cupón respecto de lo cobrado, en porcentaje, antes de pedir
   * confirmación. Espejo de `configuracion_venta_tarjeta.tolerancia_diferencia_monto_pct`.
   *
   * **Ausente = 0 = cualquier diferencia se pregunta**, que es el lado seguro y además el valor
   * configurado hoy. Queda opcional a propósito: los cuatro lugares que abren este diálogo no leen
   * la configuración del módulo todavía, y hacer que la lean es un cambio aparte.
   */
  toleranciaPct?: number;
}

interface CampoManual {
  clave: string;
  etiqueta: string;
  obligatorio: boolean;
  /** Los importes se tipean con coma o punto; el resto es texto. */
  numerico: boolean;
  /** La clave con la que el OCR devuelve este mismo dato. Sólo difiere en el monto. */
  claveOcr?: string;

  // ── Semáforo. Se calcula una vez en ngOnInit: el template no puede llamar funciones. ──
  /** El OCR lo leyó con confianza suficiente: viene cargado y no hace falta tocarlo. */
  bueno?: boolean;
  /** El OCR lo leyó mal, o no se sabe cuánto se le puede creer. Hay que confirmarlo. */
  dudoso?: boolean;
  /**
   * El lector no lo encontró. **No es lo mismo que dudoso** --no hay lectura que juzgar-- así que
   * no va en ámbar: el ámbar significa "leí esto y no me convence". Pero tampoco puede quedar sin
   * decir nada: un campo vacío y sin explicación, en un diálogo cuyo texto habla de verdes y
   * ámbares, se lee como que el sistema se olvidó de algo.
   */
  noLeido?: boolean;
  /** Lo que el OCR leyó, tal cual. Sirve para detectar si el cajero lo corrigió. */
  leido?: string;
  /** Texto del semáforo, ya armado. */
  pista?: string;
}

/**
 * A partir de cuánta confianza un campo se da por bueno y no se pregunta.
 *
 * El motor devuelve valores muy polarizados: una línea bien reconocida ronda 0,95+ y una dudosa
 * cae bastante por debajo. 0,90 deja pasar la lectura limpia y pregunta la borrosa, que es el
 * reparto que esta pantalla necesita.
 *
 * Si alguna vez hay que afinarlo por empresa, el lugar es `configuracion_venta_tarjeta`, que ya
 * es la tabla de las perillas del módulo. Hoy no vale una migración en los dos repos.
 */
const CONFIANZA_MINIMA = 0.9;

/**
 * Los campos que el sistema ya conoce por nombre, con la etiqueta que el cajero entiende y el
 * orden de lectura de un cupón.
 *
 * **No es la lista de lo que se muestra.** Eso lo decide el `mapeo` del formato: esto es sólo el
 * diccionario para los que tienen nombre propio en el modelo. Un campo mapeado que no esté acá se
 * arma solo, con el nombre del mapeo. Antes esta constante SÍ decidía qué se mostraba, y por eso
 * un campo declarado obligatorio en el mapeo --`lote` de INFONET, medido el 2026-09-16-- no se
 * dibujaba, no se validaba y no se podía exigir: la declaración del formato quedaba pisada por una
 * lista fija de cuatro.
 */
const CAMPOS_CONOCIDOS: CampoManual[] = [
  { clave: 'codigoAutorizacion', etiqueta: 'Código de autorización', obligatorio: false, numerico: false, claveOcr: 'codigoAutorizacion' },
  { clave: 'numeroBoleta', etiqueta: 'Número de boleta', obligatorio: false, numerico: false, claveOcr: 'numeroBoleta' },
  // `monto` en el cupón es el mismo dato que `montoEscaneado` en la venta.
  { clave: 'montoEscaneado', etiqueta: 'Monto del cupón', obligatorio: false, numerico: true, claveOcr: 'monto' },
  { clave: 'terminal', etiqueta: 'Terminal del cupón', obligatorio: false, numerico: false, claveOcr: 'terminal' },
  { clave: 'identificadorTransaccion', etiqueta: 'Referencia del proveedor', obligatorio: false, numerico: false, claveOcr: 'identificadorTransaccion' },
];

/**
 * Campos del mapeo que NO se le piden al cajero.
 *
 * `fecha` no es un dato que se transcriba: alimenta el control de antigüedad y viaja como
 * metadato. `moneda` se resuelve como `monedaId` desde el cobro, no se tipea.
 */
const NO_SE_TIPEAN = ['fecha', 'moneda'];

/**
 * La clave del mapeo que corresponde a cada control del formulario.
 * Sólo difiere en el monto, que en la venta se llama `montoEscaneado`.
 */
function claveDeMapeo(clave: string): string {
  return clave === 'montoEscaneado' ? 'monto' : clave;
}

/**
 * Las claves que `CompletarVentaTarjetaInput` nombra una por una. El resto viaja en `datosExtra`.
 *
 * Es un hecho del CONTRATO con el backend, no de presentación: decide dónde se guarda cada valor,
 * no si se muestra. Ahora que el formulario sale del mapeo, el diálogo puede recibir campos que no
 * tienen lugar propio --`lote`, `terminal`-- y lo correcto es que caigan en `datos_extra`, que
 * existe exactamente para eso, en vez de perderse al guardar.
 */
const CON_LUGAR_PROPIO = ['codigoAutorizacion', 'numeroBoleta', 'montoEscaneado', 'identificadorTransaccion'];

/** `lote` -> `Lote`, `codigoComercio` -> `Codigo comercio`. Para los campos sin nombre propio. */
function etiquetaDe(clave: string): string {
  const conEspacios = clave.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return conEspacios.charAt(0).toUpperCase() + conEspacios.slice(1).toLowerCase();
}

/**
 * Carga a mano del cupón.
 *
 * <b>Es la salida universal, y por eso existe.</b> El tipo del formato cierra el camino que no
 * corresponde --una terminal WEB no ofrece la cámara, una MAQUINA no ofrece el lector-- y eso sólo
 * es aceptable porque esto está disponible para cualquier tipo, siempre. Antes no existía: el
 * mensaje del filial decía «cargá el cupón a mano» y no había a mano, así que un POS físico sin QR
 * con el OCR fallado dejaba la venta PENDIENTE **y la caja sin poder cerrar**.
 *
 * Sin rol aparte: cualquier cajero puede. Queda el usuario registrado y el chequeo de cupón
 * duplicado corre igual sobre lo tipeado, que es lo que impide retipear el cupón de la venta
 * anterior.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-carga-manual-cupon-dialog',
  templateUrl: './carga-manual-cupon-dialog.component.html',
  styleUrls: ['./carga-manual-cupon-dialog.component.scss'],
})
export class CargaManualCuponDialogComponent implements OnInit {

  formGroup: FormGroup;
  campos: CampoManual[] = [];
  guardando = false;
  error: string = null;

  /**
   * El diálogo viene con datos del OCR, así que el trabajo es confirmar y no transcribir.
   * Propiedad plana: el template la bindea y el repo prohíbe getters en bindings.
   */
  esConfirmacion = false;

  /** Los campos dudosos que el cajero todavía no confirmó ni corrigió. */
  faltaConfirmar = 0;

  /** Marcas de "coincide con el ticket", por clave de campo. */
  confirmado: { [clave: string]: boolean } = {};

  titulo = 'Cargar el cupón a mano';
  ayuda = 'Copiá los datos del ticket. Los campos marcados con * son los que este aparato necesita para que la operación sirva.';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CargaManualCuponData,
    public dialogRef: MatDialogRef<CargaManualCuponDialogComponent>,
    private ventaTarjetaService: VentaTarjetaService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.campos = this.camposSegunFormato();
    this.esConfirmacion = this.data?.origen === 'OCR' && this.data?.valores != null;

    const controles: { [k: string]: FormControl } = {};
    this.campos.forEach((c) => {
      controles[c.clave] = new FormControl(
        this.valorLeido(c),
        c.obligatorio ? Validators.required : null
      );
    });
    this.formGroup = new FormGroup(controles);

    if (this.esConfirmacion) {
      this.prepararSemaforo();
      this.titulo = 'Confirmá los datos del cupón';
      // El texto anterior decía "revisá los campos marcados en ámbar", y eso se leía como "los
      // verdes no hace falta mirarlos". El 2026-09-14 quedó medido que un campo verde puede estar
      // mal: confianza 0,9657 sobre un valor equivocado. El verde dice que el lector se vio
      // seguro, no que el dato sea correcto.
      this.ayuda =
        'El lector completó lo que pudo leer. Los campos en ámbar no se leyeron con claridad y hay ' +
        'que corregirlos; los verdes conviene confirmarlos contra el ticket antes de seguir.';
      // El botón se habilita cuando no queda nada dudoso sin confirmar, así que hay que
      // recalcular con cada tecla: corregir un valor cuenta como confirmarlo.
      this.formGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.recalcular());
      this.recalcular();
    }
  }

  /**
   * Qué le creemos a cada campo.
   *
   * <b>Dudoso no es sólo "confianza baja".</b> Un campo sin entrada en `confianzas` es un campo
   * del que no se sabe --el patrón no lo capturó, o cayó en un tramo que ninguna caja cubre-- y
   * se trata igual: hay que mirarlo. Son distintos motivos para preguntar, misma acción.
   */
  private prepararSemaforo(): void {
    const confianzas = this.data.confianzas || {};
    this.campos.forEach((c) => {
      const leido = this.valorLeido(c);
      c.leido = leido == null ? null : String(leido);
      if (leido == null || leido === '') {
        // El OCR no lo trajo. No es dudoso --no hay lectura que juzgar-- pero sí hay que decirlo:
        // si además es obligatorio, es lo único que separa al cajero de poder confirmar.
        c.bueno = false;
        c.dudoso = false;
        c.noLeido = true;
        c.pista = c.obligatorio
          ? 'El lector no lo encontró — copialo del ticket para poder seguir'
          : 'El lector no lo encontró — copialo del ticket si está';
        return;
      }
      const conf = confianzas[c.claveOcr];
      c.bueno = typeof conf === 'number' && conf >= CONFIANZA_MINIMA;
      c.dudoso = !c.bueno;
      c.pista = c.bueno
        ? 'El lector está seguro — confirmalo igual contra el ticket'
        : typeof conf === 'number'
          ? 'Lectura poco clara — verificá contra el ticket'
          : 'No se pudo medir la lectura — verificá contra el ticket';
    });

    this.cruzarMontoConLoCobrado();
  }

  /**
   * El monto que dice el cupón contra el que se está cobrando.
   *
   * <b>Por qué hace falta aunque la confianza sea alta.</b> Está medido: el 2026-09-14, sobre un
   * cupón de prueba, el lector devolvió un código de autorización equivocado con confianza 0,9657
   * --por encima del umbral-- y la pantalla lo pintó de verde. La confianza dice qué tan nítido se
   * vio un carácter, no si el valor es el correcto. Para el monto sí hay con qué contrastarlo: lo
   * que la caja está cobrando.
   *
   * <b>Es la única verificación objetiva de esta pantalla.</b> El código de autorización y el
   * número de boleta no se pueden contrastar contra nada; el monto sí, y es el campo que decide
   * plata.
   */
  private cruzarMontoConLoCobrado(): void {
    const cobrado = aNumero(this.data?.monto);
    if (cobrado == null || cobrado === 0) return;   // sin referencia, no hay con qué comparar

    const campo = this.campos.find((c) => c.clave === 'montoEscaneado');
    if (!campo || !campo.leido) return;

    const leido = aNumero(campo.leido);
    if (leido == null) return;

    const tolerancia = this.data?.toleranciaPct ?? 0;
    const difPct = (Math.abs(leido - cobrado) / cobrado) * 100;
    if (difPct <= tolerancia) return;

    // Gana sobre la confianza: que el lector esté seguro no lo hace correcto.
    campo.bueno = false;
    campo.dudoso = true;
    campo.pista = 'No coincide con lo cobrado — verificá contra el ticket';
  }

  /**
   * Cuántos dudosos quedan sin resolver.
   *
   * <b>Corregir cuenta como confirmar.</b> Si el cajero cambió el valor, ya miró el ticket: pedirle
   * además un tilde sería fricción sin información. El tilde existe para el caso contrario, el de
   * "lo miré y está bien".
   */
  private recalcular(): void {
    let faltan = 0;
    this.campos.forEach((c) => {
      if (!c.dudoso) return;
      const actual = this.formGroup.get(c.clave)?.value;
      const corregido = String(actual == null ? '' : actual) !== String(c.leido == null ? '' : c.leido);
      if (!corregido && !this.confirmado[c.clave]) faltan++;
    });
    this.faltaConfirmar = faltan;
  }

  /** El tilde de "coincide con el ticket" de un campo dudoso. */
  onConfirmarCampo(clave: string, valor: boolean): void {
    this.confirmado[clave] = valor;
    this.recalcular();
  }

  /** Lo que el OCR leyó para este campo, con la clave que usa el cupón. */
  private valorLeido(c: CampoManual): any {
    const v = this.data?.valores;
    if (!v || !c.claveOcr) return null;
    const leido = v[c.claveOcr];
    return leido == null || leido === '' ? null : leido;
  }

  /**
   * Qué campos pide el formulario y cuáles son obligatorios: sale del `mapeo` del formato, que es
   * la misma declaración que le dice al OCR qué tiene que encontrar. Una sola fuente de verdad, en
   * vez de listas fijas que se desincronizan.
   *
   * <b>Qué cambió el 2026-09-16.</b> Antes el mapeo sólo decidía cuáles de cuatro campos fijos
   * eran obligatorios; ahora decide también **cuáles hay**. Un campo declarado en el mapeo y
   * ausente de esta pantalla era un `"obligatorio": true` decorativo: no se mostraba, no se
   * validaba y no se podía exigir. Medido con `lote` de INFONET.
   *
   * Los conocidos van primero, en su orden de lectura; los propios del proveedor se agregan
   * después, en el orden en que el mapeo los declara.
   *
   * Si el mapeo no se puede leer --formato viejo, JSON roto-- se piden los conocidos sin
   * obligatorios. Es preferible a no ofrecer nada: la carga a mano es la salida de emergencia y no
   * puede depender de que la configuración esté impecable.
   */
  private camposSegunFormato(): CampoManual[] {
    let mapeo: any = null;
    try {
      mapeo = this.data?.mapeo ? JSON.parse(this.data.mapeo) : null;
    } catch {
      mapeo = null;
    }
    if (!mapeo) return CAMPOS_CONOCIDOS.map((c) => ({ ...c }));

    const declarado = (clave: string) => mapeo[claveDeMapeo(clave)];

    // Los conocidos que este formato declara, y SOLO esos. `identificadorTransaccion` no es una
    // excepción: es la referencia propia del proveedor --el EndToEndId de Pix-- y los formatos que
    // no la imprimen (Infonet, Dinelco, Stone, BXX, PlugPay) no tienen por qué mostrar una casilla
    // que nadie va a llenar. Dibujarla igual era ruido en la pantalla que existe para ir rápido.
    const conocidos = CAMPOS_CONOCIDOS
      .filter((c) => declarado(c.clave) != null)
      .map((c) => ({ ...c, obligatorio: declarado(c.clave)?.obligatorio === true }));

    // Los propios del proveedor: todo lo que el mapeo declara y el modelo no conoce por nombre.
    const conocidas = CAMPOS_CONOCIDOS.map((c) => claveDeMapeo(c.clave));
    const propios: CampoManual[] = Object.keys(mapeo)
      .filter((k) => !conocidas.includes(k) && !NO_SE_TIPEAN.includes(k))
      .map((k) => ({
        clave: k,
        etiqueta: etiquetaDe(k),
        obligatorio: mapeo[k]?.obligatorio === true,
        // El teclado numérico sale del `tipo` que el formato declara, no de adivinar por el valor:
        // es la misma declaración con la que el filial valida la lectura.
        numerico: String(mapeo[k]?.tipo || '').toUpperCase() === 'NUMERO',
        claveOcr: k,
      }));

    return [...conocidos, ...propios];
  }

  /**
   * Lo que va a `venta_tarjeta.datos_extra`: lo que ya venía del OCR, más los campos del
   * formulario que no tienen lugar propio en el input.
   *
   * <b>Por qué se recalcula y no se reenvía tal cual.</b> `data.datosExtra` es lo que el extractor
   * mandó al cajón; los campos mapeados ahora llegan como campos de verdad, editables, así que si
   * el cajero corrigió el `lote` hay que guardar lo corregido y no lo leído. Reenviar el original
   * descartaría la corrección en silencio, que es el modo de falla que esta pantalla existe para
   * evitar.
   */
  private datosExtraAGuardar(): string | undefined {
    let extra: { [k: string]: any } = {};
    try {
      extra = this.data?.datosExtra ? JSON.parse(this.data.datosExtra) : {};
    } catch {
      extra = {};
    }

    this.campos
      .filter((c) => !CON_LUGAR_PROPIO.includes(c.clave))
      .forEach((c) => {
        const valor = limpiar(this.formGroup.get(c.clave)?.value);
        if (valor !== undefined) extra[c.clave] = valor;
      });

    // La fecha no se tipea pero sí se guarda: es el único registro de CUÁNDO se hizo la operación
    // en el aparato, distinto de cuándo se registró el cobro.
    const fecha = this.data?.valores?.fecha;
    if (fecha != null && fecha !== '') extra['fecha'] = String(fecha);

    return Object.keys(extra).length ? JSON.stringify(extra) : undefined;
  }

  onGuardar(): void {
    if (this.formGroup.invalid || this.guardando || this.faltaConfirmar > 0) return;
    const v = this.formGroup.value;

    // Sin un PENDIENTE al cual apuntar, el diálogo sólo devuelve lo tipeado: la venta todavía no
    // existe y el guardado lo hace el PDV junto con ella.
    if (this.data.ventaTarjetaId == null) {
      this.dialogRef.close({
        codigoAutorizacion: limpiar(v.codigoAutorizacion),
        numeroBoleta: limpiar(v.numeroBoleta),
        // El PDV lo lee como `monto` para compararlo con lo cobrado; la venta lo guarda como
        // `montoEscaneado`. Van los dos con el mismo valor para no obligar al llamador a saberlo.
        monto: aNumero(v.montoEscaneado),
        montoEscaneado: aNumero(v.montoEscaneado),
        identificadorTransaccion: limpiar(v.identificadorTransaccion),
        monedaId: this.data.monedaId,
        // Ata la foto a la venta. Sin esto la purga no puede distinguir la evidencia de un cobro
        // de una captura que quedó por el camino.
        capturaToken: this.data.capturaToken,
        origen: this.data.origen || 'MANUAL',
        datosExtra: this.datosExtraAGuardar(),
        // La fecha del cupón, para que `cuponVencido` tenga con qué comparar. Por este camino
        // llegaba siempre `undefined` y el control de 24 horas no podía dispararse nunca: andaba
        // sólo para cupones con QR, que es justo donde menos falta hace.
        fecha: aFecha(this.data?.valores?.fecha),
        manual: this.data.origen !== 'OCR',
      });
      return;
    }

    this.guardando = true;
    this.error = null;
    this.ventaTarjetaService
      .onCompletar({
        id: this.data.ventaTarjetaId,
        sucursalId: this.data.sucursalId,
        codigoAutorizacion: limpiar(v.codigoAutorizacion),
        numeroBoleta: limpiar(v.numeroBoleta),
        montoEscaneado: aNumero(v.montoEscaneado),
        identificadorTransaccion: limpiar(v.identificadorTransaccion),
        cobroDetalleId: this.data.cobroDetalleId,
        monedaId: this.data.monedaId,
        // `origen` ya se puede mandar: la columna y el campo del input viajan en esta misma
        // entrega. Un cupón confirmado desde el OCR queda como OCR y no como MANUAL — la columna
        // guarda el origen DOMINANTE, y de ahí salieron los datos; que el cajero haya corregido un
        // campo es justamente lo que el semáforo existe para provocar, no un cambio de procedencia.
        origen: this.data.origen || 'MANUAL',
        // La foto queda atada a la venta: es lo que impide que la purga se lleve la evidencia.
        capturaToken: this.data.capturaToken,
        // Los campos que no tienen lugar propio en el input, ya con las correcciones del cajero.
        datosExtra: this.datosExtraAGuardar(),
      })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.notificacionSnackbar.openSucess('Venta con tarjeta registrada');
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.guardando = false;
          // El backend valida lo mismo y devuelve el motivo exacto --cupón duplicado, moneda que
          // no coincide, estado que no es PENDIENTE-- y mostrarlo tal cual le dice al cajero qué
          // hacer, que es lo que un "algo salió mal" no hace.
          this.error = mensajeDeError(err, 'No se pudo registrar el cupón.');
          this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.danger,
            texto: this.error,
            duracion: 8,
          });
        },
      });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}

function limpiar(v: any): string {
  const s = v == null ? '' : String(v).trim();
  return s === '' ? undefined : s;
}

/**
 * La fecha que el extractor normalizó a ISO local (`2026-09-02T22:51:34`).
 *
 * Se construye componente a componente y NO con `new Date(string)`: el parseo de strings varía
 * entre motores y una fecha sin zona puede interpretarse como UTC, llegando corrida tres horas.
 * Es el mismo criterio que `qr-pos-parser.ts` aplica al cupón con QR.
 *
 * Devuelve `undefined` ante cualquier cosa que no sea esa forma exacta --el extractor devuelve el
 * valor crudo cuando no pudo normalizarlo-- y ahí el control de antigüedad simplemente no corre,
 * que es como venía funcionando.
 */
function aFecha(v: any): Date | undefined {
  if (v == null) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(v).trim());
  if (!m) return undefined;
  const [anio, mes, dia, hora, minuto] = [+m[1], +m[2], +m[3], +m[4], +m[5]];
  const d = new Date(anio, mes - 1, dia, hora, minuto, m[6] ? +m[6] : 0, 0);
  // Rebota el 31 de febrero: Date lo desborda al mes siguiente en silencio.
  if (d.getFullYear() !== anio || d.getMonth() !== mes - 1 || d.getDate() !== dia) return undefined;
  return d;
}

/** Acepta coma o punto como decimal: el cajero tipea lo que ve en el papel. */
function aNumero(v: any): number {
  if (v == null || String(v).trim() === '') return undefined;
  const n = Number(String(v).trim().replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? undefined : n;
}
