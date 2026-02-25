import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { solicitudesPagoPaginatedQuery } from './graphql-query';

export interface GetSolicitudesPagoPaginatedVariables {
  page?: number;
  size?: number;
  proveedorId?: number;
  estado?: string;
  numero?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface SolicitudPagoPageResult {
  getTotalPages?: number;
  getTotalElements?: number;
  getNumberOfElements?: number;
  isFirst?: boolean;
  isLast?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
  getContent?: SolicitudPago[];
}

export interface GetSolicitudesPagoPaginatedResponse {
  data: SolicitudPagoPageResult;
}

@Injectable({
  providedIn: 'root',
})
export class GetSolicitudesPagoPaginatedGQL extends Query<GetSolicitudesPagoPaginatedResponse, GetSolicitudesPagoPaginatedVariables> {
  document = solicitudesPagoPaginatedQuery;
}
