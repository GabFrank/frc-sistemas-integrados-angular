import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { documentosElectronicosQuery } from './graphql-query';
import { DocumentoElectronicoDto, PageInfo } from '../../dte/dte.service';

@Injectable({ providedIn: 'root' })
export class DocumentosElectronicosGQL extends Query<PageInfo<DocumentoElectronicoDto>> {
  document = documentosElectronicosQuery;
}


