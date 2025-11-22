import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { EventoInutilizacionDE, EstadoEvento } from "./evento-inutilizacion-de.model";
import { EventoInutilizacionGQL } from "./graphql/eventoInutilizacion";
import { EventosInutilizacionPorTimbradoGQL } from "./graphql/eventosInutilizacionPorTimbrado";
import { EventosInutilizacionPorEstadoGQL } from "./graphql/eventosInutilizacionPorEstado";
import { EventosInutilizacionPorSucursalGQL } from "./graphql/eventosInutilizacionPorSucursal";
import { EventosInutilizacionConFiltrosGQL } from "./graphql/eventosInutilizacionConFiltros";
import { InutilizarNumerosGQL } from "./graphql/inutilizarNumeros";
import { PageInfo } from "../../../app.component";

@Injectable({
  providedIn: 'root',
})
export class EventoInutilizacionDEService {
  constructor(
    private genericService: GenericCrudService,
    private getEventoInutilizacion: EventoInutilizacionGQL,
    private getEventosPorTimbrado: EventosInutilizacionPorTimbradoGQL,
    private getEventosPorEstado: EventosInutilizacionPorEstadoGQL,
    private getEventosPorSucursal: EventosInutilizacionPorSucursalGQL,
    private getEventosConFiltros: EventosInutilizacionConFiltrosGQL,
    private inutilizarNumeros: InutilizarNumerosGQL
  ) {}

  onGetEventoInutilizacion(id: number, sucursalId: number, servidor: boolean = true): Observable<EventoInutilizacionDE> {
    return this.genericService.onCustomQuery(
      this.getEventoInutilizacion,
      { id, sucursalId },
      servidor
    );
  }

  onGetEventosPorTimbrado(timbradoId: number, sucursalId: number, servidor: boolean = true): Observable<EventoInutilizacionDE[]> {
    return this.genericService.onCustomQuery(
      this.getEventosPorTimbrado,
      { timbradoId, sucursalId },
      servidor
    );
  }

  onGetEventosPorEstado(estado: EstadoEvento, sucursalId: number, servidor: boolean = true): Observable<EventoInutilizacionDE[]> {
    return this.genericService.onCustomQuery(
      this.getEventosPorEstado,
      { estado, sucursalId },
      servidor
    );
  }

  onGetEventosPorSucursal(sucursalId: number, servidor: boolean = true): Observable<EventoInutilizacionDE[]> {
    return this.genericService.onCustomQuery(
      this.getEventosPorSucursal,
      { sucursalId },
      servidor
    );
  }

  onGetEventosConFiltros(
    sucursalId?: number,
    timbradoId?: number,
    estado?: EstadoEvento,
    fechaInicio?: string,
    fechaFin?: string,
    page: number = 0,
    size: number = 25,
    servidor: boolean = true
  ): Observable<PageInfo<EventoInutilizacionDE>> {
    return this.genericService.onCustomQuery(
      this.getEventosConFiltros,
      {
        sucursalId,
        timbradoId,
        estado,
        fechaInicio,
        fechaFin,
        page,
        size
      },
      servidor
    );
  }

  onInutilizarNumeros(
    timbradoId: number,
    establecimiento: string,
    puntoExpedicion: string,
    numeroInicio: number,
    numeroFin: number,
    motivo: string,
    sucursalId: number,
    timbradoDetalleId?: number,
    servidor: boolean = true
  ): Observable<EventoInutilizacionDE> {
    return this.genericService.onCustomMutation(
      this.inutilizarNumeros,
      {
        timbradoId,
        establecimiento,
        puntoExpedicion,
        numeroInicio,
        numeroFin,
        motivo,
        sucursalId,
        timbradoDetalleId
      },
      servidor
    );
  }
}

