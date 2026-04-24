import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { DocumentNode } from 'graphql';
import { SAVE_RECEPCION_MERCADERIA_ITEM_MUTATION } from './recepcion-mercaderia-graphql-query';

export interface SaveRecepcionMercaderiaItemResponse {
  saveRecepcionMercaderiaItem: any;
}

@Injectable({
  providedIn: 'root'
})
export class SaveRecepcionMercaderiaItemGQL extends Mutation<SaveRecepcionMercaderiaItemResponse> {
  document: DocumentNode = SAVE_RECEPCION_MERCADERIA_ITEM_MUTATION;
} 