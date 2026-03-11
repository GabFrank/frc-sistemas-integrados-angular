import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteSolicitudPagoMutation } from './graphql-query';

export interface DeleteSolicitudPagoVariables {
  id: number;
}

export interface DeleteSolicitudPagoResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteSolicitudPagoGQL extends Mutation<DeleteSolicitudPagoResponse, DeleteSolicitudPagoVariables> {
  document = deleteSolicitudPagoMutation;
}