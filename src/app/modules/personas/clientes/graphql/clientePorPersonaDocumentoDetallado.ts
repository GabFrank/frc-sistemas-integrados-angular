import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ClienteResponse } from '../cliente.model';
import { clientePorPersonaDocumentoDetallado } from './graphql-query';

export interface Response {
  data: ClienteResponse;
}

@Injectable({
  providedIn: 'root',
})
export class ClientePorPersonaDocumentoDetalladoGQL extends Query<Response> {
  document = clientePorPersonaDocumentoDetallado;
}

