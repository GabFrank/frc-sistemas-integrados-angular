export interface ProductoVendidoEstadistica {
    productoId: string;
    descripcion: string;
    cantidad: number;
    totalMonto: number;
    porcentaje: number;
    cantidadEntrada?: number;
    cantidadVentaMovimiento?: number;
    indiceRotacion?: number;
}
