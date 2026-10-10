import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Producto } from "../../productos/producto/producto.model";

export type TipoControlStock = "VENTA" | "TRANSFERENCIA";

/** Filtro por el stock previo del registro; null = todos. */
export type FiltroStockControl = "CERO" | "NEGATIVO";

/** Salida de un producto cuyo stock en la sucursal ya era 0 o negativo. */
export interface ControlStockNegativo {
  id: number;
  sucursal: Sucursal;
  producto: Producto;
  tipo: TipoControlStock;
  cantidad: number;
  stockPrevio: number;
  /** Stock de hoy del producto en esa sucursal; null si el central no pudo calcularlo. */
  stockActual: number | null;
  usuario: Usuario;
  fecha: Date;
  referenciaId: number;
  itemId: number;
}

export interface ControlStockNegativoPage {
  getContent: ControlStockNegativo[];
  getTotalElements: number;
  getTotalPages: number;
  getNumberOfElements: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface ControlStockNegativoFiltros {
  fechaInicio: string;
  fechaFin: string;
  sucursalId: number | null;
  tipo: TipoControlStock | null;
  texto: string | null;
  stock: FiltroStockControl | null;
  page: number;
  size: number;
}
