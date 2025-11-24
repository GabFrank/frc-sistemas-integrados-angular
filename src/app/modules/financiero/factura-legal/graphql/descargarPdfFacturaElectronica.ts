import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { descargarPdfFacturaElectronicaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class DescargarPdfFacturaElectronicaGQL extends Query<String> {
  document = descargarPdfFacturaElectronicaQuery;
}

