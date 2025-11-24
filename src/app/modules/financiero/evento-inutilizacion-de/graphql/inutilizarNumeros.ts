import { Mutation } from "apollo-angular";
import { inutilizarNumerosMutation } from "./graphql-query";
import { EventoInutilizacionDE } from "../evento-inutilizacion-de.model";
import { Injectable } from "@angular/core";

export interface Response {
  data: EventoInutilizacionDE;
}

@Injectable({
  providedIn: 'root',
})
export class InutilizarNumerosGQL extends Mutation<Response> {
  document = inutilizarNumerosMutation;
}

