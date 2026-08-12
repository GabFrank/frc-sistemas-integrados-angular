import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import {
  colectarDevolucionesEnBloqueMutation,
  colectarDevolucionMutation,
} from "./graphql-query";

@Injectable({ providedIn: "root" })
export class ColectarDevolucionGQL extends Mutation {
  document = colectarDevolucionMutation;
}

@Injectable({ providedIn: "root" })
export class ColectarDevolucionesEnBloqueGQL extends Mutation {
  document = colectarDevolucionesEnBloqueMutation;
}
