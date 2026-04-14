import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Moneda } from "../../moneda/moneda.model";
import { TipoGasto } from "./tipo-gasto.model";


export class Persona {
  id: number;
  nombre: string;
}

export class Proveedor {
  id: number;
  persona: Persona;
}

export class PreGastoDetalleFinanzas {
  id: number;
  moneda: Moneda;
  formaPago: string;
  monto: number;
  creadoEn: Date;
}

export class PreGasto {
  id: number;
  sucursalId: number;
  funcionario: Persona;
  tipoGasto: TipoGasto;
  descripcion: string;
  moneda: Moneda;
  montoSolicitado: number;
  sucursalCaja: Sucursal;
  estado: string;
  qrToken: string;
  autorizadoPor: Persona;
  delegadoA: Persona;
  motivoRechazo: string;
  montoRetirado: number;
  montoGastado: number;
  saldoDevolver: number;
  usuario: Usuario;
  solicitudPagoId: number;
  beneficiarioProveedor: Proveedor;
  beneficiarioPersona: Persona;
  fechaVencimiento: Date;
  nivelUrgencia: string;
  observaciones: string;
  finanzas: PreGastoDetalleFinanzas[];
  creadoEn: Date;
}

export class PreGastoDetalleFinanzasInput {
  id?: number;
  preGastoId?: number;
  sucursalId?: number;
  monedaId?: number;
  formaPago?: string;
  monto?: number;
}

export class PreGastoInput {
  id: number;
  funcionarioId: number;
  enteId: number;
  tipoGastoId: number;
  descripcion: string;
  monedaId: number;
  montoSolicitado: number;
  sucursalCajaId: number;
  estado: string;
  autorizadoPorId: number;
  delegadoAId: number;
  motivoRechazo: string;
  montoRetirado: number;
  usuarioId: number;
  nivelUrgencia: string;
  observaciones: string;
  beneficiarioProveedorId: number;
  beneficiarioPersonaId: number;
  fechaVencimiento: string;
  finanzas: PreGastoDetalleFinanzasInput[];
}
