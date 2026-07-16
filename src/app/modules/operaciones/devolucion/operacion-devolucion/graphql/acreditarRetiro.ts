import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { acreditarRetiroMutation } from "./graphql-query";

@Injectable({ providedIn: "root" })
export class AcreditarRetiroGQL extends Mutation<{ data: any }> {
  document = acreditarRetiroMutation;
}
