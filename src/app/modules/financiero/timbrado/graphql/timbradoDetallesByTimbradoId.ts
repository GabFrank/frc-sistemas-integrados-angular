import { Query } from "apollo-angular";
import { timbradoDetallesByTimbradoIdQuery } from "./graphql-query";
import { TimbradoDetalle } from "../timbrado.modal";
import { Injectable } from "@angular/core";
import { PageInfo } from "../../../../app.component";

export interface Response {
  data: PageInfo<TimbradoDetalle>;
}

@Injectable({
  providedIn: 'root',
})
export class TimbradoDetallesByTimbradoIdGQL extends Query<Response> {
  document = timbradoDetallesByTimbradoIdQuery;
}
