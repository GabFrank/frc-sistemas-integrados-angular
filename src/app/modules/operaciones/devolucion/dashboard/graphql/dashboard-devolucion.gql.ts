import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import {
  devolucionesPorEstadoResumenQuery,
  devolucionesSeriePorDiaQuery,
  resumenDevolucionesQuery,
  topMotivosDevolucionQuery,
  topProductosDevueltosQuery,
} from "./graphql-query";

@Injectable({ providedIn: "root" })
export class ResumenDevolucionesGQL extends Query {
  document = resumenDevolucionesQuery;
}

@Injectable({ providedIn: "root" })
export class DevolucionesPorEstadoResumenGQL extends Query {
  document = devolucionesPorEstadoResumenQuery;
}

@Injectable({ providedIn: "root" })
export class TopProductosDevueltosGQL extends Query {
  document = topProductosDevueltosQuery;
}

@Injectable({ providedIn: "root" })
export class TopMotivosDevolucionGQL extends Query {
  document = topMotivosDevolucionQuery;
}

@Injectable({ providedIn: "root" })
export class DevolucionesSeriePorDiaGQL extends Query {
  document = devolucionesSeriePorDiaQuery;
}
