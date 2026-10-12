import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { CostoPorProducto } from '../../operaciones/costo-por-producto/costo-por-producto.model';
import { Usuario } from '../../personas/usuarios/usuario.model';
import { Codigo } from '../codigo/codigo.model';
import { Presentacion } from '../presentacion/presentacion.model';
import { Subfamilia } from '../sub-familia/sub-familia.model';

export class Producto {
  id: number;
  idCentral: number;
  descripcion: string;
  descripcionFactura?: string;
  iva?: number;
  unidadPorCaja?: number;
  unidadPorCajaSecundaria?: number;
  balanza?: boolean;
  stock?: boolean;
  garantia?: boolean;
  tiempoGarantia?: number;
  ingrediente?: boolean;
  combo?: boolean;
  promocion?: boolean;
  vencimiento?: boolean;
  diasVencimiento?: number;
  lote?: boolean;
  cambiable?: boolean;
  usuario?: Usuario;
  /** Miniatura de 250x250: iconos, avatares y listas. El original no se pide desde ninguna pantalla. */
  imagenPrincipalMiniatura?: string;
  /** Hasta 800 px de lado mayor: previsualizaciones. Solo la traen las consultas de un producto por id. */
  imagenPrincipalMediana?: string;
  tipoConservacion?: string;
  subfamilia?: Subfamilia;
  codigos?: Codigo[]
  sucursales?: ExistenciaCostoPorSucursal[]
  productoUltimasCompras?: ExistenciaCostoPorSucursal[]
  presentaciones: Presentacion[]
  stockPorProducto?: number;
  codigoPrincipal?: string
  costo: CostoPorProducto
  isEnvase: boolean;
  envase: Producto
  stockPorProductoDestino?: any;
  precioPrincipal: number;
  activo: boolean
  creadoEn: Date
}

export class ExistenciaCostoPorSucursal {
  fechaUltimaCompra: Date
  precio: number;
  cantidadUltimaCompra: number;
  costoMedio: number;
  existencia: number;
  // pedido: Pedido;
  sucursal: Sucursal;
  cantMinima: number;
  cantMaxima: number;
  cantMedia: number;
}

export class ProductoUltimasCompra {
  // pedido: Pedido;
  precio: number;
  cantidad: number;
  creadoEn: Date;
}
