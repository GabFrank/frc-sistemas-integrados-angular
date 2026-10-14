import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { asignarSolicitudPagoACajaMutation, solicitudPagoCajaAsignadaQuery } from './graphql-query';

/** Lo que se sabe de la asignación de una solicitud a una caja. */
export interface SolicitudPagoCajaAsignada {
  id: number;
  cajaVirtualAsignadaId: number | null;
  cajaVirtualAsignadaNombre: string | null;
}

export interface SolicitudPagoCajaAsignadaResponse {
  data: SolicitudPagoCajaAsignada;
}

@Injectable({
  providedIn: 'root',
})
export class SolicitudPagoCajaAsignadaGQL extends Query<SolicitudPagoCajaAsignadaResponse, { id: number }> {
  document = solicitudPagoCajaAsignadaQuery;
}

@Injectable({
  providedIn: 'root',
})
export class AsignarSolicitudPagoACajaGQL
  extends Mutation<SolicitudPagoCajaAsignadaResponse, { solicitudPagoId: number; cajaVirtualId: number | null }> {
  document = asignarSolicitudPagoACajaMutation;
}
