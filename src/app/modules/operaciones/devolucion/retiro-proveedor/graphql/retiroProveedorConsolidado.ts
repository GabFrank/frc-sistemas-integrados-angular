import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { RetiroProveedorConsolidado } from "../retiro-proveedor.model";
import { retiroProveedorConsolidadoQuery } from "./graphql-query";

interface Response {
  data: RetiroProveedorConsolidado;
}

@Injectable({
  providedIn: "root",
})
export class RetiroProveedorConsolidadoGQL extends Query<Response> {
  document = retiroProveedorConsolidadoQuery;
}
