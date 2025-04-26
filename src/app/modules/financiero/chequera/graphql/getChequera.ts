import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Chequera } from '../chequera.model';
import { chequeraQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetChequeraGQL extends Query<Chequera> {
  document = chequeraQuery;
} 