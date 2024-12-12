import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { PedidoItem } from "../edit-pedido/pedido-item.model";
import {
  addPedidoItemToNotaRecepcionQuery
} from "./graphql-query";

export interface Response {
  data: PedidoItem;
}

@Injectable({
  providedIn: "root",
})
export class AddPedidoItemToNotaRecepcionGQL extends Mutation<Response> {
  document = addPedidoItemToNotaRecepcionQuery;
}
