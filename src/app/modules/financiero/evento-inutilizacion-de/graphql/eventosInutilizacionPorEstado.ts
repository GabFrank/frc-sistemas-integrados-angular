import { Query } from "apollo-angular";
import { eventosInutilizacionPorEstadoQuery } from "./graphql-query";
import { EventoInutilizacionDE } from "../evento-inutilizacion-de.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: EventoInutilizacionDE[];
}

@Injectable({
  providedIn: 'root',
})
export class EventosInutilizacionPorEstadoGQL extends Query<Response> {
  document = eventosInutilizacionPorEstadoQuery;
}

