import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { transferirCajaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class TransferirCajaGQL extends Mutation<any> {
  document = transferirCajaQuery;
}