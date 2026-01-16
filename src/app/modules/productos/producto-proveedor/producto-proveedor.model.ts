import { Pedido } from "../../operaciones/compra/gestion-compras/pedido.model";
import { Proveedor } from "../../personas/proveedor/proveedor.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Producto } from "../producto/producto.model";

export class ProductoProveedor {
    id: number;
    producto: Producto;
    proveedor: Proveedor;
    pedido: Pedido;
    creadoEn: Date;
    usuario: Usuario;
    activo?: boolean;
    motivoDesvinculacion?: string;
    yaEnPedido?: boolean;
}
