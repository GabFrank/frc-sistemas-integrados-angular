import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Codigo } from "../../productos/codigo/codigo.model";
import { Producto } from "../../productos/producto/producto.model";
import { TipoMovimiento } from "./movimiento-stock.enums";

export class MovimientoStock {
    id: number;
    producto: Producto;
    codigo: Codigo;
    tipoMovimiento: TipoMovimiento;
    referencia: number;
    cantidad: number;
    sucursal: Sucursal;
    estado: boolean;
    creadoEn: Date;
    usuario: Usuario;
}

