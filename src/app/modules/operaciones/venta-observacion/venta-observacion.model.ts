import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { MotivoObservacion } from "../motivo-observacion/motivo-observacion.model";
import { SubCategoriaObservacion } from "../sub-categoria-observacion/sub-categoria-observacion.model";
import { Venta } from "../venta/venta.model";

export class VentaObservacion {
    id: number;
    descripcion: string;
    creadoEn: Date;
    venta: Venta;
    motivoObservacion: MotivoObservacion;
    sucursal: Sucursal;
    usuario: Usuario;
}