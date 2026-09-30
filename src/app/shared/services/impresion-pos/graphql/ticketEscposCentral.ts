import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { ticketEscposCentralQuery } from "./graphql-query";

class Response {
  data: string;
}

/** ticketEscpos del central (ver ImpresionPosService.imprimirTicketCentral). */
@Injectable({
  providedIn: "root",
})
export class TicketEscposCentralGQL extends Query<Response> {
  document = ticketEscposCentralQuery;
}
