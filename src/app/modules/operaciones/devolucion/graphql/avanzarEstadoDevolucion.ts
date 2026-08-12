import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { Devolucion } from "../devolucion.model";
import { avanzarEstadoDevolucionMutation } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class AvanzarEstadoDevolucionGQL extends Mutation<Devolucion> {
  document = avanzarEstadoDevolucionMutation;
}
