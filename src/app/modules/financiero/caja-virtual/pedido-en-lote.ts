import { CajaVirtualTipoMovimiento } from './caja-virtual.model';

/** Un monto del pedido. En un ajuste lleva signo; en ingreso, egreso y transferencia es positivo. */
export interface MontoCajaVirtual {
  monedaId: number;
  cantidad: number;
}

/**
 * Ingreso, egreso o ajuste en una o más monedas, tal como se envía. El central lo registra entero o no lo
 * registra; con la misma `claveIdempotencia` no lo registra dos veces (franco-system-backend-servidor#376).
 */
export interface PedidoDeMovimientos {
  cajaVirtualId: number;
  tipoMovimiento: CajaVirtualTipoMovimiento;
  montos: MontoCajaVirtual[];
  descripcion: string | null;
  claveIdempotencia: string;
}

/** Transferencia entre dos cajas en una o más monedas, tal como se envía. */
export interface PedidoDeTransferencias {
  origenId: number;
  destinoId: number;
  montos: MontoCajaVirtual[];
  descripcion: string | null;
  claveIdempotencia: string;
}
