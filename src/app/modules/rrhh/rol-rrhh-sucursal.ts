import { MainService } from '../../main.service';
import { ROLES } from '../personas/roles/roles.enum';

/**
 * Liquida en modo acotado: tiene RRHH SUCURSAL y no RRHH LIQUIDAR (ni es ADMIN). Genera y edita
 * liquidaciones y finiquitos solo de los funcionarios de las sucursales que cubren sus cajas; no aprueba,
 * no vuelve a borrador ni programa ítems para otros períodos.
 *
 * Es la misma regla que `RrhhAlcanceService.liquidaAcotado()` en el central, que es quien manda: acá solo se
 * evita mostrar lo que el central va a rechazar.
 */
export function liquidaAcotadoRrhh(mainService: MainService): boolean {
  return mainService.tieneAlgunRol([ROLES.RRHH_SUCURSAL]) && !mainService.tieneAlgunRol([ROLES.RRHH_LIQUIDAR]);
}

/** Genera y edita liquidaciones y finiquitos: RRHH LIQUIDAR o el rol acotado (el central decide de quiénes). */
export function puedeLiquidarRrhh(mainService: MainService): boolean {
  return mainService.tieneAlgunRol([ROLES.RRHH_LIQUIDAR, ROLES.RRHH_SUCURSAL]);
}

/** Paga liquidaciones y finiquitos aprobados desde el egreso de la caja: RRHH PAGAR o el rol acotado. */
export function puedePagarRrhhDesdeCaja(mainService: MainService): boolean {
  return mainService.tieneAlgunRol([ROLES.RRHH_PAGAR, ROLES.RRHH_SUCURSAL]);
}
