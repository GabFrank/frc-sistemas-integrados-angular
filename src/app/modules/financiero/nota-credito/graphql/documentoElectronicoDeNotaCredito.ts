import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { documentoElectronicoDeNotaCreditoQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class DocumentoElectronicoDeNotaCreditoGQL extends Query<any> {
  document = documentoElectronicoDeNotaCreditoQuery;
}
