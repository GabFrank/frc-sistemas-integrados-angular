import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { FacturaLegal } from "../factura-legal/factura-legal.model";
import { LoteDE } from "./lote-de/lote-de.model";

export class DocumentoElectronico {
  id: number;
  //TODO: Agregar LoteDE cuando se tenga el modelo
  loteDe: LoteDE
  facturaLegal: FacturaLegal;
  sucursal: Sucursal;
  cdc: string;
  mensajeRespuestaSifen: string;
  xmlFirmado: string;
  urlQr: string;
  usuario: Usuario;
  creadoEn: string;
  codigoRespuestaSifen: string;
  xmlOriginal: string;
  numeroDocumento: string;
  tipoDocumento: string;
  fechaEmision: string;
  fechaRecepcionSifen: string;
  activo: boolean;
  actualizadoEn: string;
  estado: EstadoDE;

  toInput(): DocumentoElectronicoInput {
    let input = new DocumentoElectronicoInput();
    input.id = this.id;
    input.sucursalId = this.sucursal?.id;
    input.facturaLegalId = this.facturaLegal?.id;
    input.cdc = this.cdc;
    input.urlQr = this.urlQr;
    input.xmlFirmado = this.xmlFirmado;
    input.xmlOriginal = this.xmlOriginal;
    input.estado = this.estado;
    input.codigoRespuestaSifen = this.codigoRespuestaSifen;
    input.mensajeRespuestaSifen = this.mensajeRespuestaSifen;
    input.numeroDocumento = this.numeroDocumento;
    input.tipoDocumento = this.tipoDocumento;
    input.fechaEmision = this.fechaEmision;
    input.fechaRecepcionSifen = this.fechaRecepcionSifen;
    input.loteDeId = this.loteDe?.id;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}

export class DocumentoElectronicoInput {
  id: number;
  sucursalId: number;
  facturaLegalId: number;
  cdc: string;
  urlQr: string;
  xmlFirmado: string;
  xmlOriginal: string;
  estado: EstadoDE;
  codigoRespuestaSifen: string;
  mensajeRespuestaSifen: string;
  numeroDocumento: string;
  tipoDocumento: string;
  fechaEmision: string;
  fechaRecepcionSifen: string;
  loteDeId: number;
  usuarioId: number;
}

export enum EstadoDE {
  PENDIENTE = 'PENDIENTE',
  EN_LOTE = 'EN_LOTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  CANCELADO = 'CANCELADO'
}