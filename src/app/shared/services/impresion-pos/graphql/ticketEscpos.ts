import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { ticketEscposQuery } from "./graphql-query";

class Response {
  data: string;
}

@Injectable({
  providedIn: "root",
})
export class TicketEscposGQL extends Query<Response> {
  document = ticketEscposQuery;
}
