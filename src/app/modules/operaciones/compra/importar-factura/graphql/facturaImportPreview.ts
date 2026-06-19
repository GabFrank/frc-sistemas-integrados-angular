import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { facturaImportPreviewQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class FacturaImportPreviewGQL extends Query {
  document = facturaImportPreviewQuery;
}
