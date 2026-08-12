import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { Devolucion } from "../devolucion.model";
import { acreditarDevolucionMutation } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class AcreditarDevolucionGQL extends Mutation<Devolucion> {
  document = acreditarDevolucionMutation;
}
