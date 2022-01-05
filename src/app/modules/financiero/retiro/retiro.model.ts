import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { PdvCaja } from "../pdv/caja/caja.model";
import { RetiroDetalle, RetiroDetalleInput } from "./retiro-detalle.model";

export class Retiro {
  id: number;
  responsable: Funcionario;
  estado: EstadoRetiro;
  observacion: String;
  cajaSalida: PdvCaja;
  cajaEntrada: PdvCaja;
  creadoEn: Date;
  usuario: Usuario;
  retiroDetalleList: RetiroDetalle[];
  retiroGs: number;
  retiroRs: number;
  retiroDs: number;

  toInput(): RetiroInput {
    let input = new RetiroInput();
    input.id = this.id;
    input.responsableId = this.responsable?.id;
    input.cajaEntradaId = this.cajaEntrada?.id;
    input.cajaSalidaId = this.cajaSalida?.id;
    input.usuarioId = this.usuario?.id;
    input.estado = this.estado;
    input.observacion = this.observacion;
    input.creadoEn = this.creadoEn;
    input.retiroGs = this.retiroGs;
    input.retiroRs = this.retiroRs;
    input.retiroDs = this.retiroDs;
    return input;
  }
  toDetalleInput(): RetiroDetalleInput[] {
    let retiroDetalleInputList: RetiroDetalleInput[] = [];
    this.retiroDetalleList.forEach((r) => {
      retiroDetalleInputList.push(r.toInput());
    });
    return retiroDetalleInputList;
  }
}

export class RetiroInput {
  id: number;
  responsableId: number;
  estado: EstadoRetiro;
  observacion: String;
  creadoEn: Date;
  usuarioId: number;
  cajaSalidaId: number;
  cajaEntradaId: number;
  retiroGs: number;
  retiroRs: number;
  retiroDs: number;
}

export enum EstadoRetiro {
  EN_PROCESO,
  CONCLUIDO,
  NECESITA_VERIFICACION,
  EN_VERIFICACION,
  VERIFICADO_CONCLUIDO_SIN_PROBLEMA,
  VERIFICADO_CONCLUIDO_CON_PROBLEMA,
}
