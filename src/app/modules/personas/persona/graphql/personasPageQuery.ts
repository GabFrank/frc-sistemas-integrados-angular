import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from '../persona.model';
import { personasPageQuery } from './graphql-query';

class Response {
  data: any
}

@Injectable({
  providedIn: 'root',
})
export class PersonasPageGQL extends Query<Response> {
  document = personasPageQuery;
}
