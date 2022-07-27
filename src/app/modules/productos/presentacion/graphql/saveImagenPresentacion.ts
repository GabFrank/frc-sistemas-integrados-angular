import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Presentacion } from '../presentacion.model';
import { saveImagenPresentacionQuery, savePresentacion } from './graphql-query';

export interface Response {
  data: Presentacion;
}


@Injectable({
  providedIn: 'root',
})
export class SaveImagenPresentacionGQL extends Mutation<boolean> {
  document = saveImagenPresentacionQuery;
}


