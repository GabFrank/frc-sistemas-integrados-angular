import { ConDesglosePeriodoGrafico } from "../../utils/grafico-desglose-periodo.model";

export interface ProductoVendidoEstadistica extends ConDesglosePeriodoGrafico {
    productoId: string;
    descripcion: string;
    cantidad: number;
    totalMonto: number;
    porcentaje: number;
    cantidadEntrada?: number;
    cantidadVentaMovimiento?: number;
    indiceRotacion?: number;
}
