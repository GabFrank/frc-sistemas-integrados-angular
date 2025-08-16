import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { documentoElectronicoByIdQuery } from './graphql-query';
import { DocumentoElectronicoDto } from '../../dte/dte.service';

@Injectable({ providedIn: 'root' })
export class DocumentoElectronicoByIdGQL extends Query<{ data: DocumentoElectronicoDto & { xmlFirmado?: string } }> {
  document = documentoElectronicoByIdQuery;
}
