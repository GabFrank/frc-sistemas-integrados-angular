import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { facturaProveedorImportsQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class FacturaProveedorImportsGQL extends Query {
  document = facturaProveedorImportsQuery;
}
