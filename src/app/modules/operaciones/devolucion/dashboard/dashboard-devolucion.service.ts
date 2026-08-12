import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import {
  DevolucionEstancada,
  DevolucionPorEstado,
  DevolucionSeriePunto,
  ResumenDevoluciones,
  TopMotivoDevolucion,
  TopProductoDevuelto,
  TopProveedorDevolucion,
} from "./dashboard-devolucion.model";
import {
  DevolucionesEstancadasGQL,
  DevolucionesPorEstadoResumenGQL,
  DevolucionesSeriePorMesGQL,
  ResumenDevolucionesGQL,
  TopMotivosDevolucionGQL,
  TopProductosDevueltosGQL,
  TopProveedoresDevolucionGQL,
} from "./graphql/dashboard-devolucion.gql";

export interface FiltroDashboard {
  fechaInicio: string;
  fechaFin: string;
  sucursalId?: number | null;
}

/** Capa de datos del dashboard de devoluciones. */
@Injectable({ providedIn: "root" })
export class DashboardDevolucionService {
  constructor(
    private genericService: GenericCrudService,
    private resumenGQL: ResumenDevolucionesGQL,
    private porEstadoGQL: DevolucionesPorEstadoResumenGQL,
    private topProductosGQL: TopProductosDevueltosGQL,
    private topMotivosGQL: TopMotivosDevolucionGQL,
    private topProveedoresGQL: TopProveedoresDevolucionGQL,
    private serieMesGQL: DevolucionesSeriePorMesGQL,
    private estancadasGQL: DevolucionesEstancadasGQL
  ) {}

  onGetResumen(f: FiltroDashboard): Observable<ResumenDevoluciones> {
    return this.query(this.resumenGQL, this.vars(f));
  }

  onGetPorEstado(f: FiltroDashboard): Observable<DevolucionPorEstado[]> {
    return this.query(this.porEstadoGQL, this.vars(f));
  }

  onGetTopProductos(
    f: FiltroDashboard,
    limite = 5
  ): Observable<TopProductoDevuelto[]> {
    return this.query(this.topProductosGQL, { ...this.vars(f), limite });
  }

  onGetTopMotivos(
    f: FiltroDashboard,
    limite = 5
  ): Observable<TopMotivoDevolucion[]> {
    return this.query(this.topMotivosGQL, { ...this.vars(f), limite });
  }

  onGetTopProveedores(
    f: FiltroDashboard,
    limite = 5
  ): Observable<TopProveedorDevolucion[]> {
    return this.query(this.topProveedoresGQL, { ...this.vars(f), limite });
  }

  onGetSeriePorMes(f: FiltroDashboard): Observable<DevolucionSeriePunto[]> {
    return this.query(this.serieMesGQL, this.vars(f));
  }

  onGetEstancadas(
    diasMinimos: number,
    sucursalId: number | null,
    limite = 10
  ): Observable<DevolucionEstancada[]> {
    return this.query(this.estancadasGQL, {
      diasMinimos,
      sucursalId: sucursalId ?? null,
      limite,
    });
  }

  private query(gql: any, vars: any): Observable<any> {
    return this.genericService.onCustomQuery(gql, vars, true, undefined, true);
  }

  private vars(f: FiltroDashboard) {
    return {
      fechaInicio: f.fechaInicio,
      fechaFin: f.fechaFin,
      sucursalId: f.sucursalId ?? null,
    };
  }
}
