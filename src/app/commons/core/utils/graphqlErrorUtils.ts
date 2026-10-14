import { esTimeoutDeLink } from "../../../shared/services/timeout-link";

// Prefijo que graphql-java antepone a toda excepción lanzada por un resolver:
// "Exception while fetching data (/data) : <mensaje real>". El path entre paréntesis varía.
const PREFIJO_GRAPHQL_JAVA = /^Exception while fetching data \([^)]*\) : /;

/**
 * Quita el envoltorio de graphql-java y deja el mensaje de negocio que escribió el backend.
 * Cualquier otro formato (o un valor que no es string) se devuelve tal cual: el llamador ya
 * tiene su propio fallback, y reventar acá dentro de un subscribe sería peor que el prefijo.
 */
export function limpiarMensajeGraphQL(msg: any): any {
  if (typeof msg !== "string") return msg;
  return msg.replace(PREFIJO_GRAPHQL_JAVA, "").trim();
}

/**
 * Copia de los errores de una respuesta GraphQL con el `message` limpio. No muta el original y
 * conserva el resto de las propiedades (`path`, `locations`, `extensions`).
 */
export function limpiarErroresGraphQL(errors: any): any {
  if (!Array.isArray(errors)) return errors;
  return errors.map((e) =>
    e != null && typeof e === "object"
      ? { ...e, message: limpiarMensajeGraphQL(e.message) }
      : e
  );
}

/** Mensaje del resultado sintético que GenericCrudService arma cuando el servidor corta sin cuerpo. */
export const MENSAJE_RESPUESTA_VACIA = "Respuesta vacía del servidor";

/**
 * ¿El error de un guardado es un **rechazo** del servidor? Solo si llegó como arreglo de errores GraphQL y ninguno
 * es la respuesta vacía: ahí el servidor dijo que no, no se guardó, y se puede corregir y reintentar.
 * Cualquier otra cosa (error de red, corte por tiempo, respuesta vacía —que también llega como arreglo—) es un
 * «sin respuesta»: la operación pudo haberse aplicado y un alta no se reintenta a ciegas (#390).
 */
export function esRechazoDelServidor(error: any): boolean {
  return Array.isArray(error)
    && error.length > 0
    && !error.some((e) => e?.message === MENSAJE_RESPUESTA_VACIA);
}

/**
 * ¿El filial rechazó la venta porque lleva factura electrónica sin nombre y llega a 7.000.000? El rechazo no trae
 * código: se reconoce por el texto de `VentaNoFacturableException` (filial, `FacturaLegalBuilder`). Si el filial
 * cambia el texto esto da false y el cajero ve el aviso de siempre. Exige un rechazo: un guardado sin
 * confirmar nunca se reintenta (#473).
 */
export function esRechazoPorFacturaSinNombre(error: any): boolean {
  return esRechazoDelServidor(error)
    && error.some((e) => typeof e?.message === "string" && /facturar sin nombre/i.test(e.message));
}

const ENVIO_A_FILIAL_SIN_CONFIRMAR =
  /^Error al crear factura en servidor filial: (Error al conectar con el servidor filial|Error del servidor filial|Error al crear factura en servidor filial\. Código)/;

/**
 * ¿El central no pudo confirmar si el filial emitió la factura? `saveFacturaLegalToFilial` devuelve todo fallo con la
 * forma de un rechazo, pero un corte con el filial (incluido el timeout de lectura del central, 30 s) o un 500 del
 * filial no dicen que no se emitió: el filial pudo terminar y guardar. Tampoco una respuesta del filial que no es
 * 201 ni error («… Código: 200»). Se reconoce por el texto de `FacturaLegalFilialService` (central), anclado a su
 * prefijo para que un rechazo que mencione esas frases no cuente; si el texto cambia, esto da false y se trata como
 * rechazo, como antes (#471).
 */
export function esEnvioAFilialSinConfirmar(error: any): boolean {
  return Array.isArray(error)
    && error.some((e) => typeof e?.message === "string" && ENVIO_A_FILIAL_SIN_CONFIRMAR.test(e.message));
}

/** Veces que se le pide el cliente al cajero por una misma venta antes de cortar. */
export const MAX_PEDIDOS_DE_CLIENTE_PARA_FACTURAR = 2;

/**
 * ¿Hay que pedirle el cliente al cajero y reenviar la venta? Solo ante el rechazo por factura sin nombre de una
 * venta común: con factura manual ya emitida el filial no factura de nuevo, en crédito o convenio el cliente
 * viaja también en el crédito y cambiarlo acá los dejaría distintos, y el delivery se cobra por otro camino.
 * `pedidos` son las veces que ya se pidió para esta venta: después de la primera, la venta trae el cliente
 * que eligió el cajero y el filial lo volvió a rechazar.
 */
export function debePedirClienteParaFacturar(caso: {
  error: any;
  tieneCliente: boolean;
  facturaManualEmitida: boolean;
  esCredito: boolean;
  esDelivery: boolean;
  pedidos: number;
}): boolean {
  if (!esRechazoPorFacturaSinNombre(caso.error)) return false;
  if (caso.facturaManualEmitida || caso.esCredito || caso.esDelivery) return false;
  if (caso.pedidos >= MAX_PEDIDOS_DE_CLIENTE_PARA_FACTURAR) return false;
  return caso.pedidos > 0 || !caso.tieneCliente;
}

/**
 * Los errores de un **rechazo** del servidor, en cualquiera de las formas en que llegan: el arreglo de `onSave` /
 * `onCustomMutation`, o un objeto con `graphQLErrors` (`onSaveCustom`, `PagarComprasService`). `null` si no es un
 * rechazo sino un «sin respuesta» (error de red, corte por tiempo, central offline, respuesta vacía): ahí la
 * operación pudo haberse aplicado (#390). Si el error trae `networkError` manda eso, aunque traiga también
 * errores GraphQL: el lado seguro es tratarlo como incierto.
 */
export function erroresDeRechazo(error: any): any[] | null {
  if (error == null || error.networkError) return null;
  const errores = Array.isArray(error) ? error : error.graphQLErrors;
  if (!Array.isArray(errores) || errores.length === 0) return null;
  if (errores.some((e) => e?.message === MENSAJE_RESPUESTA_VACIA)) return null;
  return errores;
}

/**
 * Texto para un error que llegó por la rama `error` de Apollo (no por `res.errors`). Sin
 * respuesta HTTP (status 0 o ausente: conexión caída, timeout del link) es un error de red.
 * Con un status real (401, 403, 500…) el servidor sí respondió: decir «Error de red» mentiría.
 * Apollo envuelve el `HttpErrorResponse` en `networkError`; se aceptan las dos formas.
 */
export function mensajeErrorTransporte(error: any): string {
  const status = error?.networkError?.status ?? error?.status;
  if (typeof status === "number" && status > 0) {
    return `El servidor rechazó la operación (HTTP ${status})`;
  }
  return "Error de red";
}

/**
 * Aviso que suma la pantalla cuando falla una mutation de `onCustomMutation`, o `null` si no hace falta. En un
 * rechazo el genérico ya mostró el motivo del servidor, y en el central cada mutation es una transacción: no se
 * aplicó nada. En un corte por tiempo ya avisó el timeout link. En cualquier otro «sin respuesta» (error de red,
 * central offline, respuesta vacía) nadie avisó y la operación pudo haberse aplicado o seguir corriendo: el link
 * de central offline corta a los 3 s sin cancelar el pedido. `queSeHizo` completa «No se pudo confirmar si …»
 * (p. ej. «se verificó el ítem») (#488).
 */
export function avisoTrasMutacion(error: any, queSeHizo: string): string | null {
  if (erroresDeRechazo(error) != null || esTimeoutDeLink(error)) return null;
  return `No se pudo confirmar si ${queSeHizo}: puede seguir aplicándose. Esperá unos segundos y revisá antes de repetir.`;
}
