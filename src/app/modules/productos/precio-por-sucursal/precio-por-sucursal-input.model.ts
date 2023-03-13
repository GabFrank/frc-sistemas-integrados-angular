import { TipoPrecio } from "../tipo-precio/tipo-precio.model";

export class PrecioPorSucursalInput {
    id: number;
    sucursalId: number;
    presentacionId: number;
    tipoPrecioId: TipoPrecio;
    principal: boolean;
    activo: boolean;
    precio: number;
    creadoEn: Date;
    usuarioId: number;
}