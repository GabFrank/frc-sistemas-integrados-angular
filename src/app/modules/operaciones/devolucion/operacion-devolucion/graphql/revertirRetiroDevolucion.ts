import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { revertirRetiroDevolucionMutation } from "./graphql-query";

@Injectable({ providedIn: "root" })
export class RevertirRetiroDevolucionGQL extends Mutation<{ data: any }> {
  document = revertirRetiroDevolucionMutation;
}
