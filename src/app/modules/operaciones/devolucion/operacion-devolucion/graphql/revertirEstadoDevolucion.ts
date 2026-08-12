import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { revertirEstadoDevolucionMutation } from "./graphql-query";

@Injectable({ providedIn: "root" })
export class RevertirEstadoDevolucionGQL extends Mutation<{ data: any }> {
  document = revertirEstadoDevolucionMutation;
}
