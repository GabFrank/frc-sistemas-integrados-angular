import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { descargarXmlFacturaElectronicaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class DescargarXmlFacturaElectronicaGQL extends Query<String> {
  document = descargarXmlFacturaElectronicaQuery;
}

