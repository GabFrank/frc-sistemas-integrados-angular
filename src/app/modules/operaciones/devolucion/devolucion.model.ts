import { Proveedor } from "../../personas/proveedor/proveedor.model";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { DevolucionEstado } from "./devolucion.enum";

export class Devolucion {
    id: number;
    proveedor: Proveedor;
    sucursalOrigen: Sucursal;
    fecha: Date;
    motivo: string;
    estado: DevolucionEstado;
    usuario: Usuario;
}

export class DevolucionInput {
    id?: number;
    proveedorId: number;
    sucursalOrigenId: number;
    fecha: string;
    motivo: string;
    estado: DevolucionEstado;
    usuarioId: number;
    items: DevolucionItemInput[];
}

export class DevolucionItemInput {
    id?: number;
    recepcionMercaderiaItemId: number;
    productoId: number;
    cantidad: number;
    lote: string;
} 