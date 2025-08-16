import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { DocumentosElectronicosGQL } from "./graphql/documentosElectronicos";
import { GenerarDocumentoElectronicoGQL } from "./graphql/generarDocumentoElectronico";
import { EnviarLoteNowGQL } from "./graphql/enviarLoteNow";
import { ConsultarLotesNowGQL } from "./graphql/consultarLotesNow";
import { dateToString } from "../../../commons/core/utils/dateUtils";
import { ReintentarGeneracionDteGQL } from "./graphql/reintentarGeneracionDte";
import { SeedDteMockGQL } from "./graphql/seedDteMock";
import { WipeDteDataGQL } from "./graphql/wipeDteData";
import { DocumentoElectronicoByIdGQL } from "./graphql/documentoElectronicoById";
import { RegistrarEventoDteGQL, EventoDteDto } from "./graphql/registrarEventoDte";
import { EventosPorDteGQL } from "./graphql/eventosPorDte";
import { DteMetricsGQL, DteMetrics } from "./graphql/dteMetrics";

export interface DocumentoElectronicoDto {
  id: number;
  cdc: string;
  estadoSifen: string;
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
    private enviarLoteGQL: EnviarLoteNowGQL,
    private consultarLotesGQL: ConsultarLotesNowGQL,
    private reintentarGeneracionGQL: ReintentarGeneracionDteGQL,
    private seedDteMockGQL: SeedDteMockGQL,
    private wipeDteDataGQL: WipeDteDataGQL,
    private docByIdGQL: DocumentoElectronicoByIdGQL,
    private registrarEventoGQL: RegistrarEventoDteGQL,
    private eventosPorDteGQL: EventosPorDteGQL,
    private dteMetricsGQL: DteMetricsGQL,
  ) {}

  listar(page: number, size: number, estado?: string, fechaDesde?: Date, fechaHasta?: Date, servidor = true, cdc?: string, sucursalId?: number): Observable<PageInfo<DocumentoElectronicoDto>> {
    // Formatear fechas para GraphQL en formato compatible con stringToDate del backend
    const fechaDesdeStr = fechaDesde ? dateToString(fechaDesde, "yyyy-MM-dd'T'HH:mm:ss") : undefined;
    const fechaHastaStr = fechaHasta ? dateToString(fechaHasta, "yyyy-MM-dd'T'HH:mm:ss") : undefined;
    
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

  enviarLoteNow(servidor = true): Observable<{ id: number; idProtocoloSifen: string; estadoSifen: string; }> {
    const usuarioId = Number(localStorage.getItem('usuarioId')) || undefined;
    return this.genericService.onCustomMutation(this.enviarLoteGQL, { usuarioId }, servidor);
  }

  consultarLotesNow(servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(this.consultarLotesGQL, {}, servidor);
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

  seedMock(cantidad = 20, diasAtras = 30, servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(this.seedDteMockGQL, { cantidad, diasAtras }, servidor);
  }

  wipeData(servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(this.wipeDteDataGQL, {}, servidor);
  }

  getById(id: number, servidor = true) {
    return this.genericService.onCustomQuery(this.docByIdGQL, { id }, servidor);
  }

  metrics(servidor = true) {
    return this.genericService.onCustomQuery(this.dteMetricsGQL, {}, servidor);
  }
}


