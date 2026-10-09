/**
 * ¿El central rechazó el ajuste porque el saldo ya no es el que se veía en pantalla? Son los dos rechazos de
 * `AjusteDeSaldoService` (franco-system-backend-servidor#376): el saldo «cambió» desde que se abrió el diálogo, o
 * «ya coincide» con lo contado. En los dos el saldo en pantalla quedó viejo, así que hay que cerrar y releer.
 *
 * Se reconoce por el texto: el error de GraphQL del central solo trae el mensaje, sin código.
 */
export function esRechazoPorSaldo(errores: any[] | null): boolean {
  return (errores || []).some(e => {
    const mensaje = String(e?.message || '');
    return mensaje.includes('cambió') || mensaje.includes('ya coincide con lo contado');
  });
}
