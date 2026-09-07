import {
  DatosCupon,
  FormatoQrPos,
  MapeoQrPos,
  ReglaCampo,
  ResultadoParseo,
} from './formato-qr-pos.model';

/**
 * Lee el QR impreso en el cupon del POS y lo convierte en los campos de una venta con tarjeta.
 *
 * El formato NO esta en el codigo: viene de `financiero.formato_qr_pos`, que se carga desde la
 * pantalla de administracion. A ValidaPix le pedimos nuestro formato (FRCP1) y acepto; el resto
 * de los proveedores imprime lo que ya tiene, y a eso hay que adaptarse sin un release.
 *
 * Lo que este motor NO puede resolver: el lector es keyboard-wedge con teclado es-LA. Si un
 * proveedor imprime multilinea, o caracteres que el wedge no tipea, no hay regex que lo salve.
 */

/**
 * Tope de la cadena aceptada. Java no tiene timeout de regex y JS tampoco: contra un patron con
 * backtracking patologico, acotar la entrada es la unica defensa barata. Ningun cupon legitimo
 * se acerca — el FRCP1 real mide 66 caracteres.
 */
export const MAX_LONGITUD_QR = 512;

/** Decimales por moneda, para los importes que vienen en la menor unidad. */
export interface DecimalesPorMoneda {
  [monedaId: number]: number;
}

/**
 * Prueba los formatos contra la cadena escaneada y devuelve los datos del primero que la
 * reconozca.
 *
 * `formatos` viene ordenado por prioridad: primero el del proveedor de la terminal que el cajero
 * ya escaneo antes de cobrar, despues el resto. Ese orden importa — si un formato ajeno matchea
 * primero, se cargarian importes de otro proveedor.
 */
export function parsearCupon(
  cadena: string,
  formatos: FormatoQrPos[],
  decimalesPorMoneda: DecimalesPorMoneda = {}
): ResultadoParseo {
  const cruda = (cadena || '').trim();
  if (!cruda) {
    return { ok: false, error: 'No se leyó ningún código.' };
  }
  if (cruda.length > MAX_LONGITUD_QR) {
    return {
      ok: false,
      error: `El código leído tiene ${cruda.length} caracteres y el máximo es ${MAX_LONGITUD_QR}.`,
    };
  }
  if (!formatos || formatos.length === 0) {
    return {
      ok: false,
      error: 'No hay ningún formato de QR configurado. Cargalo en Financiero → Formatos de QR.',
    };
  }

  for (const formato of formatos) {
    const match = intentarMatch(cruda, formato);
    if (!match) continue;
    try {
      return { ok: true, datos: extraer(match, cruda, formato, decimalesPorMoneda) };
    } catch (e) {
      return {
        ok: false,
        error: `El formato "${formato.nombre}" reconoció el código pero no pudo leerlo: ${
          e?.message || e
        }`,
      };
    }
  }

  return {
    ok: false,
    error: 'El código leído no corresponde a ningún formato conocido. Registralo desde el celular.',
  };
}

/**
 * Un patron mal cargado no debe tumbar la caja: si el regex no compila se saltea ese formato y se
 * sigue con los demas. El ABM del central ya valida que compile, pero la fila viaja por
 * replicacion y esto corre en el PDV, con el cliente esperando.
 */
function intentarMatch(cadena: string, formato: FormatoQrPos): RegExpMatchArray | null {
  if (!formato?.patron) return null;
  try {
    return cadena.match(new RegExp(formato.patron));
  } catch {
    return null;
  }
}

function extraer(
  match: RegExpMatchArray,
  cruda: string,
  formato: FormatoQrPos,
  decimalesPorMoneda: DecimalesPorMoneda
): DatosCupon {
  const mapeo: MapeoQrPos = JSON.parse(formato.mapeo || '{}');
  const grupos = match.groups || {};

  const datos: DatosCupon = { qrCrudo: cruda, formato };

  datos.codigoAutorizacion = texto(grupos, mapeo.codigoAutorizacion);
  datos.numeroBoleta = texto(grupos, mapeo.numeroBoleta);
  datos.identificadorTransaccion = texto(grupos, mapeo.identificadorTransaccion);
  datos.monedaId = numeroMapeado(grupos, mapeo.moneda);
  datos.monto = importe(grupos, mapeo.monto, datos.monedaId, decimalesPorMoneda);
  datos.fecha = fecha(grupos, mapeo.fecha);

  return datos;
}

function crudo(grupos: { [k: string]: string }, regla?: ReglaCampo): string | undefined {
  if (!regla?.de) return undefined;
  const valor = grupos[regla.de];
  return valor === undefined ? undefined : valor;
}

function texto(grupos: { [k: string]: string }, regla?: ReglaCampo): string | undefined {
  const valor = crudo(grupos, regla);
  if (valor === undefined) return undefined;
  // Un grupo vacío es un dato válido, no un error: en Pix el número de boleta no existe.
  const limpio = valor.trim();
  if (!limpio) return '';
  return regla?.mayusculas ? limpio.toUpperCase() : limpio;
}

function numeroMapeado(grupos: { [k: string]: string }, regla?: ReglaCampo): number | undefined {
  const valor = crudo(grupos, regla);
  if (valor === undefined || !regla?.mapa) return undefined;
  const id = regla.mapa[valor.trim().toUpperCase()];
  if (id === undefined) {
    throw new Error(`la moneda "${valor}" no está en el mapeo del formato`);
  }
  return id;
}

/**
 * El importe viene como entero en la menor unidad de su moneda. Cuánto vale depende de la moneda:
 * 9455 en reales son 94,55 y en guaraníes son 9.455. Por eso `escalaSegunMoneda` consulta los
 * decimales de la moneda resuelta en vez de aplicar una constante — una escala fija estaría mal
 * en una de las dos.
 */
function importe(
  grupos: { [k: string]: string },
  regla: ReglaCampo | undefined,
  monedaId: number | undefined,
  decimalesPorMoneda: DecimalesPorMoneda
): number | undefined {
  const valor = crudo(grupos, regla);
  if (valor === undefined || !valor.trim()) return undefined;

  const entero = Number(valor);
  if (!isFinite(entero)) {
    throw new Error(`el importe "${valor}" no es un número`);
  }

  if (regla?.escalaSegunMoneda) {
    const decimales = monedaId !== undefined ? decimalesPorMoneda[monedaId] : undefined;
    if (decimales === undefined) {
      throw new Error('no se pudieron determinar los decimales de la moneda para escalar el importe');
    }
    return entero / Math.pow(10, decimales);
  }
  if (regla?.escala) {
    return entero / regla.escala;
  }
  return entero;
}

/**
 * Fecha del cupón, en hora local del comercio.
 *
 * Se construye componente a componente y NO con `new Date(string)`: el parseo de strings varía
 * entre motores y un cupón interpretado como UTC llegaría corrido tres horas, que es justo la
 * diferencia que tiene el EndToEndId de Pix respecto de este campo.
 */
function fecha(grupos: { [k: string]: string }, regla?: ReglaCampo): Date | undefined {
  const valor = crudo(grupos, regla);
  if (valor === undefined || !valor.trim()) return undefined;
  if (regla?.formato !== 'yyyyMMddHHmm') {
    throw new Error(`formato de fecha no soportado: ${regla?.formato}`);
  }
  if (!/^\d{12}$/.test(valor)) {
    throw new Error(`la fecha "${valor}" no tiene 12 dígitos`);
  }
  const anio = Number(valor.slice(0, 4));
  const mes = Number(valor.slice(4, 6));
  const dia = Number(valor.slice(6, 8));
  const hora = Number(valor.slice(8, 10));
  const minuto = Number(valor.slice(10, 12));

  const d = new Date(anio, mes - 1, dia, hora, minuto, 0, 0);
  // Rebota 31 de febrero y compañía: Date los desborda al mes siguiente en silencio.
  if (d.getFullYear() !== anio || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
    throw new Error(`la fecha "${valor}" no existe`);
  }
  return d;
}

/**
 * Ordena los formatos poniendo primero el del proveedor de la terminal que el cajero escaneó, y
 * después los comodines (los que no tienen proveedor asignado).
 *
 * Saber el proveedor de antemano es lo que evita adivinar: el cajero ya eligió la maquinita antes
 * de cobrar. Si el cupón termina matcheando el formato de otro proveedor, es señal de que escaneó
 * la terminal equivocada — por eso los demás quedan al final en vez de descartarse.
 */
export function ordenarPorProveedor(
  formatos: FormatoQrPos[],
  proveedorServicioId?: number
): FormatoQrPos[] {
  const activos = (formatos || []).filter((f) => f?.activo !== false);
  // Number() en los dos lados por lo mismo que formatoCruzado (ver su comentario): el id del
  // formato es `Int` y el de la terminal es `ID` de GraphQL, o sea número contra string. Con ===
  // estricto el formato de la propia terminal NUNCA sacaba prioridad 0: quedaba empatado con los
  // ajenos (2) y los comodines (1) se probaban ANTES, que es exactamente el orden que este
  // docstring dice que hay que evitar.
  const terminal = proveedorServicioId == null ? null : Number(proveedorServicioId);
  const prioridad = (f: FormatoQrPos): number => {
    const idCrudo = f?.proveedorServicioId ?? f?.proveedorServicio?.id;
    if (idCrudo === undefined || idCrudo === null) return 1;
    const id = Number(idCrudo);
    if (terminal !== null && !isNaN(terminal) && !isNaN(id) && id === terminal) return 0;
    return 2;
  };
  return [...activos].sort((a, b) => prioridad(a) - prioridad(b));
}

/**
 * Antigüedad máxima aceptada para la fecha del cupón. Un cupón de ayer en la caja de hoy es casi
 * siempre un papel traspapelado, no la venta que se está cobrando.
 */
export const HORAS_ANTIGUEDAD_MAXIMA = 24;

export function cuponVencido(fechaCupon?: Date, ahora: Date = new Date()): boolean {
  if (!fechaCupon) return false;
  const horas = (ahora.getTime() - fechaCupon.getTime()) / 3_600_000;
  return horas > HORAS_ANTIGUEDAD_MAXIMA;
}

/**
 * Detecta el cupón escaneado en la terminal equivocada.
 *
 * `parsearCupon` prueba, a propósito, los formatos de OTROS proveedores además del de la
 * terminal elegida (para no rechazar de entrada un cupón que resultó ser de otra máquina). Eso
 * significa que un cupón de la Terminal B puede matchear igual mientras el cajero cobra en la
 * Terminal A, y sin este chequeo el sistema lo aceptaría en silencio.
 *
 * Un formato comodín (sin proveedor asignado) nunca cuenta como cruce: es el que se usa
 * justamente para terminales sin proveedor propio todavía.
 */
export function formatoCruzado(formato: FormatoQrPos, proveedorServicioIdTerminal?: number): boolean {
  const idFormato = formato?.proveedorServicioId ?? formato?.proveedorServicio?.id;
  if (idFormato === undefined || idFormato === null) return false;
  if (proveedorServicioIdTerminal === undefined || proveedorServicioIdTerminal === null) return false;

  // Number() en los dos lados a propósito. Los dos valores vienen del MISMO backend pero con
  // tipos GraphQL distintos: FormatoQrPos.proveedorServicioId es `Int` (llega número) y
  // ProveedorServicio.id es `ID!` (llega string). Comparados con !== estricto, 24 !== "24" da
  // true y CADA cupón correcto se marcaría como "de otra terminal" — una falsa alarma en todos
  // los escaneos, apenas se carguen proveedores en formatos y terminales.
  const a = Number(idFormato);
  const b = Number(proveedorServicioIdTerminal);
  if (isNaN(a) || isNaN(b)) return false;
  return a !== b;
}
