import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { retirosFlotantesDeCajaQuery, retirosFlotantesQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class RetirosFlotantesGQL extends Query<Response> {
  document = retirosFlotantesQuery;
}

@Injectable({ providedIn: 'root' })
export class RetirosFlotantesDeCajaGQL extends Query<Response> {
  document = retirosFlotantesDeCajaQuery;
}
