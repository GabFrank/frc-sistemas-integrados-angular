import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { capturaMuestraQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class CapturaMuestraGQL extends Query {
  document = capturaMuestraQuery;
}
