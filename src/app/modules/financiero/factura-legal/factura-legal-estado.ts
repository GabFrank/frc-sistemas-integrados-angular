import { EstadoDE } from '../documento-electronico/documento-electronico.model';
import { FacturaLegal } from './factura-legal.model';

/**
 * Reglas de estado de una factura legal a partir de `activo` y del documento electrónico.
 *
 * `activo` en null o undefined es ACTIVA: desde fines de 2025 la filial insertó las facturas sin el
 * flag y no se rellenó hacia atrás, así que null y true son sinónimos y solo false es cancelada.
 * Por eso acá nunca se compara contra true.
 */

export function esFacturaElectronica(factura: FacturaLegal): boolean {
  return !!(factura?.cdc && factura.cdc.trim().length > 0);
}

/** Para facturas en papel. Una electrónica se lee por el estado de su documento, no por `activo`. */
export function facturaActiva(factura: FacturaLegal): boolean {
  return factura?.activo !== false;
}

/**
 * Electrónica: solo con el documento APROBADO, que es lo único que SIFEN deja cancelar. No se mira
 * `activo`: una factura pendiente o rechazada también lo tiene en true.
 * Papel: mientras no esté cancelada.
 */
export function puedeCancelarseFactura(factura: FacturaLegal): boolean {
  if (esFacturaElectronica(factura)) {
    return factura.documentoElectronico?.estado === EstadoDE.APROBADO;
  }
  return facturaActiva(factura);
}
