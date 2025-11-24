import { Query } from "apollo-angular";
import { eventoInutilizacionQuery } from "./graphql-query";
import { EventoInutilizacionDE } from "../evento-inutilizacion-de.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: EventoInutilizacionDE;
}

@Injectable({
  providedIn: 'root',
})
export class EventoInutilizacionGQL extends Query<Response> {
  document = eventoInutilizacionQuery;
}

