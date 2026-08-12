import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import {
  devolucionesEstancadasQuery,
  devolucionesPorEstadoResumenQuery,
  devolucionesSeriePorMesQuery,
  resumenDevolucionesQuery,
  topMotivosDevolucionQuery,
  topProductosDevueltosQuery,
  topProveedoresDevolucionQuery,
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
export class TopProveedoresDevolucionGQL extends Query {
  document = topProveedoresDevolucionQuery;
}

@Injectable({ providedIn: "root" })
export class DevolucionesSeriePorMesGQL extends Query {
  document = devolucionesSeriePorMesQuery;
}

@Injectable({ providedIn: "root" })
export class DevolucionesEstancadasGQL extends Query {
  document = devolucionesEstancadasQuery;
}
