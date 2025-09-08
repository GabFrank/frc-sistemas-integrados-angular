import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { DocumentosElectronicosGQL } from "./graphql/documentosElectronicos";
import { GenerarDocumentoElectronicoGQL } from "./graphql/generarDocumentoElectronico";
import { dateToString } from "../../../commons/core/utils/dateUtils";
import { ReintentarGeneracionDteGQL } from "./graphql/reintentarGeneracionDte";
import { DocumentoElectronicoByIdGQL } from "./graphql/documentoElectronicoById";
import { RegistrarEventoDteGQL, EventoDteDto } from "./graphql/registrarEventoDte";
import { EventosPorDteGQL } from "./graphql/eventosPorDte";
import { DteMetricsGQL } from "./graphql/dteMetrics";

export interface DocumentoElectronicoDto {
  id: number;
  cdc: string;
  estadoSifen: string;
  sucursal: {
    nombre: string;
  };
  urlQr: string;
  creadoEn: string;
  mensajeSifen?: string;
}

export interface PageInfo<T> {
  getTotalPages: number;
  getTotalElements: number;
  getNumberOfElements: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  getContent: T[];
}

export interface DocumentoElectronicoDetalle extends DocumentoElectronicoDto {
  xmlFirmado?: string;
}

@Injectable({ providedIn: "root" })
export class DteService {
  constructor(
    private genericService: GenericCrudService,
    private documentosGQL: DocumentosElectronicosGQL,
    private generarGQL: GenerarDocumentoElectronicoGQL,
    private reintentarGeneracionGQL: ReintentarGeneracionDteGQL,
    private docByIdGQL: DocumentoElectronicoByIdGQL,
    private registrarEventoGQL: RegistrarEventoDteGQL,
    private eventosPorDteGQL: EventosPorDteGQL,
    private dteMetricsGQL: DteMetricsGQL,
  ) {}

  listar(page: number, size: number, estado?: string, fechaDesde?: Date, fechaHasta?: Date, servidor = true, cdc?: string, sucursalId?: number): Observable<PageInfo<DocumentoElectronicoDto>> {
    // Formatear fechas para GraphQL en formato compatible con stringToDate del backend
    const fechaDesdeStr = fechaDesde ? dateToString(fechaDesde, "yyyy-MM-dd'T'HH:mm:ss") : undefined;
    const fechaHastaStr = fechaHasta ? dateToString(fechaHasta, "yyyy-MM-dd'T'HH:mm:ss") : undefined;

    // Debug temporal
    console.log('DEBUG Frontend - Enviando a backend:', {
      page,
      size,
      estado,
      fechaDesde: fechaDesdeStr,
      fechaHasta: fechaHastaStr,
      cdc,
      sucursalId
    });

    return this.genericService.onCustomQuery(this.documentosGQL, {
      page,
      size,
      estado,
      fechaDesde: fechaDesdeStr,
      fechaHasta: fechaHastaStr,
      cdc,
      sucursalId,
    }, servidor);
  }

  generar(ventaId: number, sucursalId: number, servidor = true): Observable<DocumentoElectronicoDto> {
    const usuarioId = Number(localStorage.getItem('usuarioId')) || undefined;
    return this.genericService.onCustomMutation(this.generarGQL, { ventaId, sucursalId, usuarioId }, servidor);
  }


  reintentarGeneracion(dteId: number, servidor = true): Observable<DocumentoElectronicoDto> {
    const usuarioId = Number(localStorage.getItem('usuarioId')) || undefined;
    return this.genericService.onCustomMutation(this.reintentarGeneracionGQL, { dteId, usuarioId }, servidor);
  }

  registrarEvento(documentoElectronicoId: number, tipoEvento: number, motivo?: string, observacion?: string, servidor = true): Observable<EventoDteDto> {
    const usuarioId = Number(localStorage.getItem('usuarioId')) || undefined;
    return this.genericService.onCustomMutation(this.registrarEventoGQL, { documentoElectronicoId, tipoEvento, usuarioId, motivo, observacion }, servidor);
  }

  listarEventos(dteId: number, servidor = true) {
    return this.genericService.onCustomQuery(this.eventosPorDteGQL, { dteId }, servidor);
  }

  getById(id: number, servidor = true) {
    return this.genericService.onCustomQuery(this.docByIdGQL, { id }, servidor);
  }

  metrics(servidor = true) {
    return this.genericService.onCustomQuery(this.dteMetricsGQL, {}, servidor);
  }
}


