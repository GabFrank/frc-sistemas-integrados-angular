import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { PedidoItem } from "../edit-pedido/pedido-item.model";
import {
  addPedidoItemListToNotaRecepcionQuery
} from "./graphql-query";

export interface Response {
  data: PedidoItem;
}

@Injectable({
  providedIn: "root",
})
export class AddPedidoItemListToNotaRecepcionGQL extends Mutation<Response> {
  document = addPedidoItemListToNotaRecepcionQuery;
}
