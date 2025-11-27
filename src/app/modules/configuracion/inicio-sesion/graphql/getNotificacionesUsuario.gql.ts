import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { getNotificacionesUsuarioQuery } from "./graphql-query";

export interface NotificacionData {
  id: number;
  leida: boolean;
  fechaLeida?: string;
  fechaEnvio?: string;
  estadoEnvio?: string;
  interactuada?: boolean;
  fechaInteraccion?: string;
  accionRealizada?: string;
  estadoTablero?: string;
  notificacion: {
    id: number;
    titulo: string;
    mensaje: string;
    tipo: string;
    creadoEn: string;
  };
}

export interface NotificacionUsuarioPage {
  content: NotificacionData[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface GetNotificacionesUsuarioResponse {
  data: NotificacionUsuarioPage;
}

@Injectable({
  providedIn: "root",
})
export class GetNotificacionesUsuarioGQL extends Query<GetNotificacionesUsuarioResponse> {
  override document = getNotificacionesUsuarioQuery;
}
