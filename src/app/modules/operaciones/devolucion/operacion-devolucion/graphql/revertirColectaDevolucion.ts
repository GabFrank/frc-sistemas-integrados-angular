import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { revertirColectaDevolucionMutation } from "./graphql-query";

@Injectable({ providedIn: "root" })
export class RevertirColectaDevolucionGQL extends Mutation<{ data: any }> {
  document = revertirColectaDevolucionMutation;
}
