import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { Devolucion } from "../devolucion.model";
import { saveDevolucionMutation } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class SaveDevolucionGQL extends Mutation<Devolucion> {
  document = saveDevolucionMutation;
}
