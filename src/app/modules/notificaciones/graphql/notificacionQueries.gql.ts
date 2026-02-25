import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { conteoNotificacionesNoLeidasQuery } from "./graphql-query";

@Injectable({
    providedIn: "root",
})
export class ConteoNotificacionesNoLeidasGQL extends Query {
    override document = conteoNotificacionesNoLeidasQuery;
}
