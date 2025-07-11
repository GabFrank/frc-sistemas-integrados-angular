import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import {
  SolicitudPago,
  SolicitudPagoEstado,
  SolicitudPagoMultipleRecepcionesInput,
} from "./solicitud-pago.model";
import { SolicitudPagoQuery } from "./graphql/solicitudPago";
import { SolicitudPagoPorUsuarioIdQuery } from "./graphql/solicitudPagoPorUsuarioId";
import { SaveSolicitudPagoMutation } from "./graphql/saveSolicitudPago";
import { SolicitudPagoConFiltrosQuery } from "./graphql/solicitudPagoConFiltros";
import {
  ImprimirSolicitudPagoMutation,
  ImprimirSolicitudPagoVariables,
} from "./graphql/imprimirSolicitudPago";
import { PageInfo } from "../../../app.component";
import { dateToString } from "../../../commons/core/utils/dateUtils";
import { CrearSolicitudPagoMultipleRecepcionesGQL } from "./graphql/crearSolicitudPagoMultipleRecepciones";

@Injectable({
  providedIn: "root",
})
export class SolicitudPagoService {
  constructor(
    private genericService: GenericCrudService,
    private getSolicitudPago: SolicitudPagoQuery,
    private getSolicitudPagoPorUsuarioId: SolicitudPagoPorUsuarioIdQuery,
    private saveSolicitudPagoMutation: SaveSolicitudPagoMutation,
    private solicitudPagoConFiltrosQuery: SolicitudPagoConFiltrosQuery,
    private imprimirSolicitudPagoMutation: ImprimirSolicitudPagoMutation,
    private crearSolicitudPagoMultipleRecepcionesGQL: CrearSolicitudPagoMultipleRecepcionesGQL
  ) {}

  /**
   * Obtiene una solicitud de pago por su ID
   * @param id ID de la solicitud de pago
   * @returns Observable con la solicitud de pago
   */
  onGetSolicitudPago(id): Observable<SolicitudPago> {
    return this.genericService.onGetById(this.getSolicitudPago, id);
  }

  /**
   * Obtiene las solicitudes de pago de un usuario por su ID
   * @param usuarioId ID del usuario
   * @returns Observable con un array de solicitudes de pago
   */
  onGetSolicitudPagoPorUsuarioId(usuarioId): Observable<SolicitudPago[]> {
    return this.genericService.onGetById(
      this.getSolicitudPagoPorUsuarioId,
      usuarioId
    );
  }

  /**
   * Guarda una solicitud de pago (para edición o creación manual)
   * @param input Datos de la solicitud de pago a guardar
   * @returns Observable con la solicitud de pago guardada
   */
  onSaveSolicitudPago(input): Observable<SolicitudPago> {
    return this.genericService.onSave(this.saveSolicitudPagoMutation, {
      entity: input,
    });
  }

  /**
   * Crea una nueva solicitud de pago a partir de una o más recepciones de mercadería.
   * Este es el método principal para el nuevo flujo de trabajo.
   * @param input Objeto con los IDs de las recepciones y otros datos necesarios.
   * @returns Observable con la solicitud de pago creada.
   */
  onCrearSolicitudPagoMultipleRecepciones(input: SolicitudPagoMultipleRecepcionesInput): Observable<SolicitudPago> {
    return this.genericService.onCustomMutation(
      this.crearSolicitudPagoMultipleRecepcionesGQL,
      { entity: input }
    );
  }


  /**
   * Busca solicitudes de pago aplicando filtros
   * @param solicitudPagoId ID directo de la solicitud de pago (opcional)
   * @param estado Estado de la solicitud de pago (opcional)
   * @param fechaInicio Fecha de inicio para filtrar (opcional)
   * @param fechaFin Fecha de fin para filtrar (opcional)
   * @param pageIndex Índice de página
   * @param pageSize Tamaño de página
   * @returns Observable con página de resultados
   */
  onSearchConFiltros(
    solicitudPagoId?: number,
    estado?: SolicitudPagoEstado,
    fechaInicio?: string,
    fechaFin?: string,
    pageIndex = 0,
    pageSize = 25
  ): Observable<PageInfo<SolicitudPago>> {

    // Convert solicitudPagoId to string if provided, otherwise null
    const idStr = solicitudPagoId ? solicitudPagoId.toString() : null;

    // Pass pageIndex and pageSize directly as parameters
    return this.genericService.onCustomQuery(
      this.solicitudPagoConFiltrosQuery,
      {
        solicitudPagoId: idStr, // New parameter for direct ID lookup
        estado: estado || null,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        page: pageIndex,
        size: pageSize,
      }
    );
  }

  /**
   * Imprime una solicitud de pago con los datos del formulario
   * @param solicitudPagoId ID de la solicitud de pago
   * @param proveedorNombre Nombre del proveedor para la impresión
   * @param fechaDePago Fecha de pago
   * @param formaPago Forma de pago
   * @param nominal Si es cheque nominal (solo para cheques)
   * @param tipoImpresion true = PDF, false = Ticket 58mm
   * @param printerName Nombre de impresora (opcional, para tickets)
   * @returns Observable con el resultado (PDF base64 o confirmación de ticket)
   */
  onImprimirSolicitudPago(
    solicitudPagoId: number,
    proveedorNombre: string,
    fechaDePago: Date,
    formaPago: string,
    nominal?: boolean,
    tipoImpresion: boolean = true,
    printerName?: string
  ): Observable<string> {
    const variables: ImprimirSolicitudPagoVariables = {
      solicitudPagoId,
      proveedorNombre,
      fechaDePago: dateToString(fechaDePago),
      formaPago,
      nominal,
      tipoImpresion,
      printerName,
    };
    // here we need to use the genericService.onCustomMutation because the mutation is not a standard mutation
    return this.genericService.onCustomMutation(
      this.imprimirSolicitudPagoMutation,
      variables
    );
  }
}
