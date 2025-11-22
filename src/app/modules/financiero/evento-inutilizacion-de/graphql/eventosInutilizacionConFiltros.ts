import { Query } from "apollo-angular";
import { eventosInutilizacionConFiltrosQuery } from "./graphql-query";
import { EventoInutilizacionDE } from "../evento-inutilizacion-de.model";
import { PageInfo } from "../../../../app.component";
import { Injectable } from "@angular/core";

export interface Response {
  data: PageInfo<EventoInutilizacionDE>;
}

@Injectable({
  providedIn: 'root',
})
export class EventosInutilizacionConFiltrosGQL extends Query<Response> {
  document = eventosInutilizacionConFiltrosQuery;
}

