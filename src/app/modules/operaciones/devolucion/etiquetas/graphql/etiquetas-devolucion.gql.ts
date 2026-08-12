import { Injectable } from "@angular/core";
import { Mutation, Query } from "apollo-angular";
import {
  etiquetasSeparadoPdfQuery,
  imprimirEtiquetasSeparadoMutation,
} from "./graphql-query";

@Injectable({ providedIn: "root" })
export class EtiquetasSeparadoPdfGQL extends Query {
  document = etiquetasSeparadoPdfQuery;
}

@Injectable({ providedIn: "root" })
export class ImprimirEtiquetasSeparadoGQL extends Mutation {
  document = imprimirEtiquetasSeparadoMutation;
}
