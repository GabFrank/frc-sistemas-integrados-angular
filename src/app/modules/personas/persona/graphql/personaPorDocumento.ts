import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from '../persona.model';
import { personaPorDocumento } from './graphql-query';

class Response {
  data: Persona
}

@Injectable({
  providedIn: 'root',
})
export class PersonaPorDocumentoGQL extends Query<Response> {
  document = personaPorDocumento;
}
