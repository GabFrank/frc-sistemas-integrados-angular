import { Injectable } from '@angular/core';
import {
  QR_PREFIJO, QrCrudo, QrError, QrErrorTipo, QrParseResultado, QrTipoSoportado,
} from './qr-lector.model';

/**
 * Parser de los códigos QR/barra que emite el sistema.
 *
 * Solo parsea y valida forma: no consulta el backend ni decide a dónde ir. La resolución
 * del documento y el ruteo viven en el diálogo del carrito, que es quien tiene el contexto
 * de la caja y puede aplicar el control de acceso.
 *
 * Ver qr-lector.model.ts para por qué el resultado son campos por posición y no un objeto
 * con nombres: los emisores reales no respetan las mismas posiciones entre sí.
 */
@Injectable({ providedIn: 'root' })
export class QrLectorService {

  /**
   * Normaliza y parsea un código leído.
   *
   * La normalización importa más de lo que parece: los lectores HID agregan CR, LF o ambos
   * al terminar, y algunos mandan espacios de relleno. Un CR pegado al último segmento
   * lo ensucia sin que se note, porque el último segmento casi nunca se usa.
   */
  parse(codigoLeido: string): QrParseResultado {
    const raw = (codigoLeido || '').replace(/[\r\n\t]/g, '').trim();

    if (!raw) {
      return this.error(QrErrorTipo.VACIO, 'No se leyó ningún código. Volvé a escanear.');
    }

    // El split se limita a los segmentos del formato: si un campo trae un guión de más,
    // se queda dentro del último campo en vez de correr todas las posiciones siguientes.
    const partes = this.dividir(raw);

    if ((partes[0] || '').toLowerCase() !== QR_PREFIJO) {
      return this.error(
        QrErrorTipo.PREFIJO_INVALIDO,
        'Ese código no es del sistema. Escaneá el QR del documento, no el código de barras del producto.',
      );
    }

    const tipoEntidad = (partes[2] || '').trim().toUpperCase();
    if (!tipoEntidad || partes.length < 4) {
      return this.error(QrErrorTipo.INCOMPLETO, 'El código está incompleto o dañado. Probá de nuevo.');
    }

    const qr: QrCrudo = {
      raw,
      sucursalId: this.aNumero(partes[1]),
      tipoEntidad,
      idOrigen: this.aNumero(partes[3]),
      idCentral: this.aNumero(partes[4]),
      campo5: this.aTexto(partes[5]),
      campo6: this.aTexto(partes[6]),
      campo7: this.aTexto(partes[7]),
    };

    if (qr.idOrigen == null) {
      return this.error(QrErrorTipo.INCOMPLETO, 'El código no trae el número de documento.');
    }

    if (!this.esSoportado(tipoEntidad)) {
      return this.error(
        QrErrorTipo.TIPO_DESCONOCIDO,
        `Este código es de un documento que la caja no puede cobrar ni pagar (${tipoEntidad}).`,
      );
    }

    return { ok: true, qr };
  }

  /** true si el lector sabe qué hacer con ese tipo. */
  esSoportado(tipoEntidad: string): boolean {
    return Object.values(QrTipoSoportado).includes(tipoEntidad as QrTipoSoportado);
  }

  /**
   * Segunda mitad de la PK del documento, cuando el tipo la necesita.
   *
   * `Retiro` tiene PK compuesta (id, sucursalId), así que necesita las dos. Pero el campo
   * de sucursal del formato viene en 0 en varios emisores, así que se cae al idCentral,
   * que es donde el emisor del retiro la va a poner.
   */
  sucursalDe(qr: QrCrudo): number | null {
    if (qr.sucursalId != null && qr.sucursalId > 0) return qr.sucursalId;
    if (qr.idCentral != null && qr.idCentral !== qr.idOrigen) return qr.idCentral;
    return null;
  }

  /** Divide en como mucho los segmentos del formato; el resto queda pegado al último. */
  private dividir(raw: string): string[] {
    const todas = raw.split('-');
    if (todas.length <= 8) return todas;
    return [...todas.slice(0, 7), todas.slice(7).join('-')];
  }

  private aNumero(valor: string): number | null {
    if (valor == null) return null;
    const limpio = valor.trim();
    if (!limpio || limpio.toLowerCase() === 'null' || limpio.toLowerCase() === 'undefined') return null;
    const n = Number(limpio);
    return Number.isFinite(n) ? n : null;
  }

  private aTexto(valor: string): string | null {
    if (valor == null) return null;
    const limpio = valor.trim();
    if (!limpio || limpio.toLowerCase() === 'null' || limpio.toLowerCase() === 'undefined') return null;
    return limpio;
  }

  private error(tipo: QrErrorTipo, mensaje: string): QrParseResultado {
    const error: QrError = { tipo, mensaje };
    return { ok: false, error };
  }
}
