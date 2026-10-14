import { MainService } from '../../../main.service';
import { ROLES } from '../../personas/roles/roles.enum';

/** Roles de tesorería que ven más allá de sus cajas: con cualquiera de ellos no hay modo acotado. */
const ROLES_AMPLIOS = [
  ROLES.TESORERIA_VER, ROLES.TESORERIA_GESTIONAR, ROLES.TESORERIA_CPC_COBRAR, ROLES.TESORERIA_CPP_PAGAR,
];

/**
 * Modo acotado: el usuario tiene TESORERIA CAJA y ningún rol amplio de tesorería (ni es ADMIN). Opera
 * solo las cajas a las que tiene acceso y no ve saldos bancarios, cheques ni la deuda global.
 *
 * Es la misma regla que `TesoreriaSecurityService.esSoloCaja()` en el central, que es quien manda: acá
 * solo se evita mostrar lo que el central va a rechazar.
 */
export function esSoloTesoreriaCaja(mainService: MainService): boolean {
  return mainService.tieneAlgunRol([ROLES.TESORERIA_CAJA]) && !mainService.tieneAlgunRol(ROLES_AMPLIOS);
}

/**
 * Mueve plata en modo acotado: tiene TESORERIA CAJA y no TESORERIA GESTIONAR. No alcanza con «solo caja»:
 * con CAJA + VER el usuario ve lo global, pero sigue operando como el rol acotado. Espeja
 * `TesoreriaSecurityService.operaAcotado()`.
 */
export function operaAcotadoCaja(mainService: MainService): boolean {
  return mainService.tieneAlgunRol([ROLES.TESORERIA_CAJA]) && !mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
}

/** Idem para pagar: TESORERIA CAJA sin ninguno de los roles que pagan. Espeja `pagaAcotado()` del central. */
export function pagaAcotadoCaja(mainService: MainService): boolean {
  return mainService.tieneAlgunRol([ROLES.TESORERIA_CAJA])
    && !mainService.tieneAlgunRol([ROLES.TESORERIA_CPP_PAGAR, ROLES.TESORERIA_GESTIONAR]);
}

/** Puede mover el efectivo de una caja: TESORERIA GESTIONAR o el rol acotado (el ACL decide sobre cuáles). */
export function puedeOperarCaja(mainService: MainService): boolean {
  return mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR, ROLES.TESORERIA_CAJA]);
}
