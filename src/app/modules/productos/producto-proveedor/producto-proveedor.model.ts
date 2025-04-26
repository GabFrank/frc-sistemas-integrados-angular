import { Pedido } from "../../operaciones/pedido/edit-pedido/pedido.model";
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
}
