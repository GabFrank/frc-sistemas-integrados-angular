import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { chequePorPagoDetalleCuotaIdQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetChequePorPagoDetalleCuotaIdGQL extends Query<Cheque> {
  document = chequePorPagoDetalleCuotaIdQuery;
} 