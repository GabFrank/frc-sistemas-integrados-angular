import { Injectable } from "@angular/core";
import { Mutation, Query } from "apollo-angular";
import {
  devolucionConfiguracionQuery,
  guardarDevolucionConfiguracionMutation,
} from "./graphql-query";

@Injectable({ providedIn: "root" })
export class DevolucionConfiguracionGQL extends Query {
  document = devolucionConfiguracionQuery;
}

@Injectable({ providedIn: "root" })
export class GuardarDevolucionConfiguracionGQL extends Mutation {
  document = guardarDevolucionConfiguracionMutation;
}
