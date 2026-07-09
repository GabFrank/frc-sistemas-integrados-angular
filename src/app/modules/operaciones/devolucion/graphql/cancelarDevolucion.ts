import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { Devolucion } from "../devolucion.model";
import { cancelarDevolucionMutation } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class CancelarDevolucionGQL extends Mutation<Devolucion> {
  document = cancelarDevolucionMutation;
}
