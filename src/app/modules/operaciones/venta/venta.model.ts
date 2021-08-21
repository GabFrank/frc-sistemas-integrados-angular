import { Cliente } from "../../personas/clientes/cliente.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { TipoVenta } from "./enums/tipo-venta.enums";
import { VentaEstado } from "./enums/venta-estado.enums";
import { VentaItem } from "./venta-item.model";

export class Venta {
    id: number;
    cliente: Cliente;
    tipoVenta: TipoVenta;
    estado: VentaEstado;
    creadoEn: Date;
    usuario: Usuario;
    ventaItemList: VentaItem[];
    valorDescuento: number;
    valorTotal: number;
}