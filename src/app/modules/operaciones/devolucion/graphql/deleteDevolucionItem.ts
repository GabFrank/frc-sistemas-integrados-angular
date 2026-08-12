import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { deleteDevolucionItemMutation } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class DeleteDevolucionItemGQL extends Mutation<boolean> {
  document = deleteDevolucionItemMutation;
}
