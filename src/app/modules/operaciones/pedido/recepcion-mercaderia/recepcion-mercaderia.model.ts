import { Moneda } from "../../../financiero/moneda/moneda.model";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { RecepcionMercaderiaEstado } from "./recepcion-mercaderia.enum";

export class RecepcionMercaderia {
    id: number;
    proveedor: Proveedor;
    sucursalRecepcion: Sucursal;
    fecha: Date;
    moneda: Moneda;
    cotizacion: number;
    estado: RecepcionMercaderiaEstado;
    usuario: Usuario;
}

export class RecepcionMercaderiaInput {
    id?: number;
    proveedorId: number;
    sucursalRecepcionId: number;
    fecha: string;
    monedaId: number;
    cotizacion: number;
    estado: RecepcionMercaderiaEstado;
    usuarioId: number;
    notaRecepcionIds: number[];
    items: RecepcionMercaderiaItemInput[];
    costosAdicionales: RecepcionCostoAdicionalInput[];
}

export class RecepcionMercaderiaItemInput {
    id?: number;
    notaRecepcionItemId: number;
    pedidoItemDistribucionId?: number;
    productoId: number;
    sucursalEntregaId: number;
    cantidadRecibida: number;
    cantidadRechazada: number;
    esBonificacion: boolean;
    vencimientoRecibido: string;
    lote: string;
    motivoRechazo: string;
    observacion: string;
}

export class RecepcionCostoAdicionalInput {
    id?: number;
    descripcion: string;
    monto: number;
    monedaId: number;
} 