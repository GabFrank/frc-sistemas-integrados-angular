import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { PedidoItem } from '../edit-pedido/pedido-item.model';

export class PedidoItemSucursal {
    id: number;
    pedidoItem: PedidoItem;
    sucursal: Sucursal;
    sucursalEntrega: Sucursal;
    
    // 📦 Pedido inicial
    cantidadPorUnidad: number;
    
    // ✅ Recepción efectiva
    cantidadPorUnidadRecibida: number;
    cantidadPorUnidadRechazada: number;
    
    // 🛑 Rechazo y modificación
    rechazado: boolean = false;
    motivoRechazo: string; // ej: "VENCIDO", "FALTANTE", "AVERÍADO"
    modificado: boolean = false;
    motivoModificacion: string; // ej: "PRESENTACION INCORRECTA", "CANTIDAD INCONSISTENTE"
    
    // 👤 Usuario y trazabilidad
    usuarioRecepcion: Usuario;
    fechaRecepcion: Date;
    
    verificado: boolean = false;
    observacion: string;
    
    // Audit fields
    creadoEn: Date;
    usuario: Usuario;

    // Legacy field for backward compatibility
    stockDisponible: number;

    toInput(): PedidoItemSucursalInput {
        let input = new PedidoItemSucursalInput();
        input.id = this?.id;
        input.pedidoItemId = this?.pedidoItem?.id;
        input.sucursalId = this?.sucursal?.id;
        input.sucursalEntregaId = this?.sucursalEntrega?.id;
        input.cantidadPorUnidad = this?.cantidadPorUnidad;
        input.cantidadPorUnidadRecibida = this?.cantidadPorUnidadRecibida;
        input.cantidadPorUnidadRechazada = this?.cantidadPorUnidadRechazada;
        input.rechazado = this?.rechazado;
        input.motivoRechazo = this?.motivoRechazo;
        input.modificado = this?.modificado;
        input.motivoModificacion = this?.motivoModificacion;
        input.usuarioRecepcionId = this?.usuarioRecepcion?.id;
        input.fechaRecepcion = this?.fechaRecepcion;
        input.verificado = this?.verificado;
        input.observacion = this?.observacion;
        input.usuarioId = this?.usuario?.id;
        return input;
    }
}

export class PedidoItemSucursalInput {
    id?: number;
    pedidoItemId?: number;
    sucursalId?: number;
    sucursalEntregaId?: number;
    
    // 📦 Pedido inicial
    cantidadPorUnidad?: number;
    
    // ✅ Recepción efectiva
    cantidadPorUnidadRecibida?: number;
    cantidadPorUnidadRechazada?: number;
    
    // 🛑 Rechazo y modificación
    rechazado?: boolean;
    motivoRechazo?: string;
    modificado?: boolean;
    motivoModificacion?: string;
    
    // 👤 Usuario y trazabilidad
    usuarioRecepcionId?: number;
    fechaRecepcion?: Date;
    
    verificado?: boolean;
    observacion?: string;
    
    // Audit fields
    usuarioId?: number;
} 