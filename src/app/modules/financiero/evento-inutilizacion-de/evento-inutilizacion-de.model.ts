import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Timbrado } from "../timbrado/timbrado.modal";
import { TimbradoDetalle } from "../timbrado/timbrado.modal";

export class EventoInutilizacionDE {
  id: number;
  sucursalId: number;
  timbrado: Timbrado;
  timbradoDetalle: TimbradoDetalle;
  eventoId: string;
  fechaFirma: Date;
  establecimiento: string;
  puntoExpedicion: string;
  numeroInicio: number;
  numeroFin: number;
  tipoDE: string;
  motivoInutilizacion: string;
  xmlEvento: string;
  estado: EstadoEvento;
  fechaProcesamiento: Date;
  protocoloAutorizacion: string;
  codigoRespuesta: string;
  mensajeRespuesta: string;
  respuestaBruta: string;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
  usuario: Usuario;
  sucursal: Sucursal;
}

export enum EstadoEvento {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  ERROR_ENVIO = 'ERROR_ENVIO'
}

