import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { DocumentNode } from 'graphql';
import { SAVE_RECEPCION_MERCADERIA_MUTATION } from './recepcion-mercaderia-graphql-query';

export interface SaveRecepcionMercaderiaResponse {
  saveRecepcionMercaderia: any;
}

@Injectable({
  providedIn: 'root'
})
export class SaveRecepcionMercaderiaGQL extends Mutation<SaveRecepcionMercaderiaResponse> {
  document: DocumentNode = SAVE_RECEPCION_MERCADERIA_MUTATION;
} 