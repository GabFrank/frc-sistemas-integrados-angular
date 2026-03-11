import { Sucursal } from "../../../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../../personas/usuarios/usuario.model";
import { Pedido } from "../pedido.model";

export class PedidoSucursalInfluencia {
  id: number;
  pedido: Pedido;
  sucursal: Sucursal;
  creadoEn: Date;
  usuario: Usuario;
}