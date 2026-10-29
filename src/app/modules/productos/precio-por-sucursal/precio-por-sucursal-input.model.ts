import { TipoPrecio } from "../tipo-precio/tipo-precio.model";

export class PrecioPorSucursalInput {
    id: number;
    sucursalId: number;
    presentacionId: number;
    tipoPrecioId: number;
    principal: boolean;
    activo: boolean;
    precio: number;
    usuarioId: number = null;
    /**
     * Moneda del precio. NO viaja si no hace falta (un central viejo rechaza la clave): solo cuando el usuario
     * eligió una moneda distinta de la de la empresa o el precio ya la tenía guardada. El central la guarda
     * como null cuando es la de la empresa; sin la clave, un alta usa la del módulo PRECIOS y una edición
     * conserva la guardada.
     */
    monedaId?: number;
}