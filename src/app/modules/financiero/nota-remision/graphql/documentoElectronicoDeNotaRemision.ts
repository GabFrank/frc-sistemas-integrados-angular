import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { documentoElectronicoDeNotaRemisionQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class DocumentoElectronicoDeNotaRemisionGQL extends Query<any> {
  document = documentoElectronicoDeNotaRemisionQuery;
}
