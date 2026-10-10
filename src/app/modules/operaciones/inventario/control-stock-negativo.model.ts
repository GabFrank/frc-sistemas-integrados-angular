import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Producto } from "../../productos/producto/producto.model";

export type TipoControlStock = "VENTA" | "TRANSFERENCIA";

/** Salida de un producto cuyo stock en la sucursal ya era 0 o negativo. */
export interface ControlStockNegativo {
  id: number;
  sucursal: Sucursal;
  producto: Producto;
  tipo: TipoControlStock;
  cantidad: number;
  stockPrevio: number;
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
  page: number;
  size: number;
}
