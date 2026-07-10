import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import {
  DevolucionPorEstado,
  DevolucionSeriePunto,
  ResumenDevoluciones,
  TopMotivoDevolucion,
  TopProductoDevuelto,
} from "./dashboard-devolucion.model";
import {
  DevolucionesPorEstadoResumenGQL,
  DevolucionesSeriePorDiaGQL,
  ResumenDevolucionesGQL,
  TopMotivosDevolucionGQL,
  TopProductosDevueltosGQL,
} from "./graphql/dashboard-devolucion.gql";

export interface FiltroDashboard {
  fechaInicio: string;
  fechaFin: string;
  sucursalId?: number | null;
}

/** Capa de datos del dashboard de devoluciones (5 queries de agregación). */
@Injectable({ providedIn: "root" })
export class DashboardDevolucionService {
  constructor(
    private genericService: GenericCrudService,
    private resumenGQL: ResumenDevolucionesGQL,
    private porEstadoGQL: DevolucionesPorEstadoResumenGQL,
    private topProductosGQL: TopProductosDevueltosGQL,
    private topMotivosGQL: TopMotivosDevolucionGQL,
    private serieGQL: DevolucionesSeriePorDiaGQL
  ) {}

  onGetResumen(f: FiltroDashboard): Observable<ResumenDevoluciones> {
    return this.genericService.onCustomQuery(
      this.resumenGQL,
      this.vars(f),
      true,
      undefined,
      true
    );
  }

  onGetPorEstado(f: FiltroDashboard): Observable<DevolucionPorEstado[]> {
    return this.genericService.onCustomQuery(
      this.porEstadoGQL,
      this.vars(f),
      true,
      undefined,
      true
    );
  }

  onGetTopProductos(
    f: FiltroDashboard,
    limite = 5
  ): Observable<TopProductoDevuelto[]> {
    return this.genericService.onCustomQuery(
      this.topProductosGQL,
      { ...this.vars(f), limite },
      true,
      undefined,
      true
    );
  }

  onGetTopMotivos(
    f: FiltroDashboard,
    limite = 5
  ): Observable<TopMotivoDevolucion[]> {
    return this.genericService.onCustomQuery(
      this.topMotivosGQL,
      { ...this.vars(f), limite },
      true,
      undefined,
      true
    );
  }

  onGetSerie(f: FiltroDashboard): Observable<DevolucionSeriePunto[]> {
    return this.genericService.onCustomQuery(
      this.serieGQL,
      this.vars(f),
      true,
      undefined,
      true
    );
  }

  private vars(f: FiltroDashboard) {
    return {
      fechaInicio: f.fechaInicio,
      fechaFin: f.fechaFin,
      sucursalId: f.sucursalId ?? null,
    };
  }
}
