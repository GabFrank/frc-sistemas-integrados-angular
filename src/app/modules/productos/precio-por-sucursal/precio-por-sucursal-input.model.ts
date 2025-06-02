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
}