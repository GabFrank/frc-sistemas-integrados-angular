export class CompraInput {
    id: number;
    pedido: number;
    proveedor: number;
    estado: string;
    fecha: Date;
    tipoBoleta: string;
    nroNota: string;
    tipoPago: string;
    valorParcial: number;
    descuento: number;
    valorTotal: number;
    creadoPor: number;
}
