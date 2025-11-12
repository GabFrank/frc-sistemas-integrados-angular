import { Usuario } from "../../../personas/usuarios/usuario.model";
import { DocumentoElectronico } from "../documento-electronico.model";

export class LoteDE {
  id: number;
  estado: EstadoLoteDE;
  fechaProcesado: Date;
  fechaUltimoIntento: Date;
  intentos: number;
  respuestaSifen: string;
  protocolo: string;
  documentosElectronicos: DocumentoElectronico[];
  creadoEn: Date;
  actualizadoEn: Date;
  usuario: Usuario;

  toInput(): LoteDEInput {
    let input = new LoteDEInput();
    input.id = this.id;
    input.estado = this.estado;
    input.fechaProcesado = this.fechaProcesado;
    input.fechaUltimoIntento = this.fechaUltimoIntento;
    input.intentos = this.intentos;
    input.respuestaSifen = this.respuestaSifen;
    input.protocolo = this.protocolo;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}

export class LoteDEInput {
  id: number;
  estado: EstadoLoteDE;
  fechaProcesado: Date;
  fechaUltimoIntento: Date;
  intentos: number;
  respuestaSifen: string;
  protocolo: string;
  usuarioId: number;
}

export enum EstadoLoteDE {
  PENDIENTE_ENVIO = 'PENDIENTE_ENVIO',
  EN_PROCESO = 'EN_PROCESO',
  PROCESADO = 'PROCESADO',
  PROCESADO_CON_ERRORES = 'PROCESADO_CON_ERRORES',
  ERROR_ENVIO = 'ERROR_ENVIO',
  ERROR_RED = 'ERROR_RED',
  ERROR_PERMANENTE = 'ERROR_PERMANENTE',
  RECHAZADO = 'RECHAZADO'
}