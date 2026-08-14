import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { imprimirTicketRetiroProveedorMutation } from "./graphql-query";

interface Response {
  data: boolean;
}

@Injectable({
  providedIn: "root",
})
export class ImprimirTicketRetiroProveedorGQL extends Mutation<Response> {
  document = imprimirTicketRetiroProveedorMutation;
}
