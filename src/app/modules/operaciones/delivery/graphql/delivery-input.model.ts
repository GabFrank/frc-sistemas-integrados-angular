import { DeliveryEstado } from "../enums";

export interface DeliveryInput {
    id?: number
    ventaId?: number
    entregadorId?: number
    vehiculoId?: number
    direccion?: String
    telefono: String
    estado: DeliveryEstado
    precioId: number
    usuarioId?: number
    valor: number
    barrioId?: number;
    vueltoId?: number;
}