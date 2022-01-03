import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { saveVentaItemList } from './graphql-query';

class Response {
  data: boolean
}

@Injectable({
  providedIn: 'root',
})
export class SaveVentaItemListGQL extends Mutation<Response> {
  document = saveVentaItemList;
}
