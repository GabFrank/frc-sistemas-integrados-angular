import { DeliveryEstado } from "../enums";

export class DeliveryInput {
    id?: number
    ventaId?: number
    entregadorId?: number
    vehiculoId?: number
    direccion?: string
    telefono: string
    estado: DeliveryEstado
    precioId: number
    usuarioId?: number
    valor: number
    barrioId?: number;
    vueltoId?: number;
}