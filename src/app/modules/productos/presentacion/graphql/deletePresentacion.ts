import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Presentacion } from '../presentacion.model';
import { deletePresentacionQuery } from './graphql-query';


export interface Response {
  data: Presentacion;
}


@Injectable({
  providedIn: 'root',
})
export class DeletePresentacionGQL extends Mutation{
  document = deletePresentacionQuery;
}


