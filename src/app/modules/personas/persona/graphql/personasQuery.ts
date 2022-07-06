import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from '../persona.model';
import { personasQuery } from './graphql-query';

class Response {
  data: Persona[]
}

@Injectable({
  providedIn: 'root',
})
export class PersonasGQL extends Query<Response> {
  document = personasQuery;
}
