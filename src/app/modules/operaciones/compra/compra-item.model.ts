import { Usuario } from '../../personas/usuarios/usuario.model';
import { Producto } from '../../productos/producto/producto.model';
import { CompraItemEstado } from './compra-enums';
import { Compra } from './compra.model';

export class CompraItem {
  id: number;
  compra: Compra;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
  valorTotal: number;
  bonificacion: boolean;
  observacion: string;
  lote: string;
  vencimiento: Date;
  estado: CompraItemEstado;
  creadoEn: Date;
  usuario: Usuario;
}
