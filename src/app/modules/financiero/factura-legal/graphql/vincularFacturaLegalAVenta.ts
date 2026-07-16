import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { vincularFacturaLegalAVenta } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class VincularFacturaLegalAVentaGQL extends Mutation<any> {
  document = vincularFacturaLegalAVenta;
}
