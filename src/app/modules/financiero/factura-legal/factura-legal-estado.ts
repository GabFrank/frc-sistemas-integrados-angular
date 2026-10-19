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

/** Clase del badge de estado (colores en el scss de quien lo muestra): el listado y el diálogo de edición. */
export function claseEstadoFactura(factura: FacturaLegal): string {
  if (!esFacturaElectronica(factura)) {
    return facturaActiva(factura) ? 'estado-activo' : 'estado-inactivo';
  }
  switch (factura.documentoElectronico?.estado) {
    case EstadoDE.APROBADO:
      return 'estado-aprobado';
    case EstadoDE.PENDIENTE:
    case EstadoDE.EN_LOTE:
      return 'estado-pendiente';
    case EstadoDE.RECHAZADO:
      return 'estado-rechazado';
    case EstadoDE.CANCELADO:
      return 'estado-cancelado';
    default:
      return 'estado-default';
  }
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
