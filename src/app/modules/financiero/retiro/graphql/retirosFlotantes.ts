import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { retirosFlotantesDeCajaQuery, retirosFlotantesQuery, retirosIngresadosDeCajaQuery } from './graphql-query';

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

@Injectable({ providedIn: 'root' })
export class RetirosIngresadosDeCajaGQL extends Query<Response> {
  document = retirosIngresadosDeCajaQuery;
}
