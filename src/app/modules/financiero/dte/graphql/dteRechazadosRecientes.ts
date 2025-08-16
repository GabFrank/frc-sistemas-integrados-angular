import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { dteRechazadosRecientesQuery } from './graphql-query';
import { DocumentoElectronicoDto } from '../dte.service';

@Injectable({ providedIn: 'root' })
export class DteRechazadosRecientesGQL extends Query<{ data: DocumentoElectronicoDto[] }> {
  document = dteRechazadosRecientesQuery;
}
