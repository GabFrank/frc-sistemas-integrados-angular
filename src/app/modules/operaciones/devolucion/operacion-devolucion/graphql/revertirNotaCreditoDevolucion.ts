import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { revertirNotaCreditoDevolucionMutation } from "./graphql-query";

@Injectable({ providedIn: "root" })
export class RevertirNotaCreditoDevolucionGQL extends Mutation<{ data: any }> {
  document = revertirNotaCreditoDevolucionMutation;
}
