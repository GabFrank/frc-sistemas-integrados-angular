import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cheque } from '../cheque.model';
import { chequeQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetChequeGQL extends Query<Cheque> {
  document = chequeQuery;
} 