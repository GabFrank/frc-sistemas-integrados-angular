import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { CajaMotivoObservacion } from "../caja-motivo-observacion/caja-motivo-observacion.model";
import { PdvCaja } from "../caja/caja.model";

export class CajaObservacion {
  id: number;
  descripcion: string;
  creadoEn: Date;
  cajaMotivoObservacion: CajaMotivoObservacion;
  usuario: Usuario;
  pdvCaja: PdvCaja;
  sucursal: Sucursal;
}