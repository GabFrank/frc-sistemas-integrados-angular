import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoPresentacion } from '../tipo-presentacion.model';
import { tiposPresentacionQuery } from './graphql-query';


export interface Response {
  data: TipoPresentacion[];
}

@Injectable({
  providedIn: 'root',
})
export class AllTiposPresentacionesQueryGQL extends Query<Response> {
  document = tiposPresentacionQuery;
}
