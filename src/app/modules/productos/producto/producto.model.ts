import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { CostoPorProducto } from '../../operaciones/costo-por-producto/costo-por-producto.model';
import { Pedido } from '../../operaciones/pedido/edit-pedido/pedido.model';
import { Proveedor } from '../../personas/proveedor/proveedor.model';
import { Usuario } from '../../personas/usuarios/usuario.model';
import { Codigo } from '../codigo/codigo.model';
import { Presentacion } from '../presentacion/presentacion.model';
import { Subfamilia } from '../sub-familia/sub-familia.model';

export class Producto {
  id: number;
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
  cambiable?: boolean;
  usuario?: Usuario;
  imagenPrincipal?: string;
  tipoConservacion?: string;
  subfamilia?: Subfamilia;
  codigos?: [Codigo]
  sucursales?: [ExistenciaCostoPorSucursal]
  productoUltimasCompras?: [ExistenciaCostoPorSucursal]
  presentaciones: Presentacion[]
  stockPorProducto?: number;
  codigoPrincipal?: string
  costo: CostoPorProducto
  isEnvase: boolean;
  envase: Producto
}

export class ExistenciaCostoPorSucursal {
  fechaUltimaCompra: Date
  precio: number;
  cantidadUltimaCompra: number;
  costoMedio: number;
  existencia: number;
  pedido: Pedido;
  sucursal: Sucursal;
  cantMinima: number;
  cantMaxima: number;
  cantMedia: number;
}

export class ProductoUltimasCompra {
  pedido: Pedido;
  precio: number;
  cantidad: number;
  creadoEn: Date;
}
