import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { notificacionesPorTokenQuery } from "./graphql-query";

export interface NotificacionData {
  id: number;
  leida: boolean;
  fechaLeida?: string;
  fechaEnvio?: string;
  estadoEnvio?: string;
  estadoTablero?: string;
  notificacion: {
    id: number;
    titulo: string;
    mensaje: string;
    tipo: string;
    creadoEn: string;
  };
}

export interface NotificacionesPorTokenResponse {
  data: NotificacionData[];
}

@Injectable({
  providedIn: "root",
})
export class NotificacionesPorTokenGQL extends Query<NotificacionesPorTokenResponse> {
  override document = notificacionesPorTokenQuery;
}

