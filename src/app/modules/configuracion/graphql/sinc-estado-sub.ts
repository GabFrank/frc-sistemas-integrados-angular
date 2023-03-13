import { Injectable } from "@angular/core";
import { Subscription } from "apollo-angular";
import { SincronizacionStatus } from "../sincronizacion-status";
import { sincEstadoSubQuery } from "./graphql-query";

export interface Response {
  data: SincronizacionStatus;
}

@Injectable({
  providedIn: "root",
})
export class SincEstadoGQL extends Subscription<SincronizacionStatus> {
  document = sincEstadoSubQuery;
}
