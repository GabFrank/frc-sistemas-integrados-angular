import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from '../persona.model';
import { personaQuery, personasSearch } from './graphql-query';

class Response {
  data: Persona
}

@Injectable({
  providedIn: 'root',
})
export class PersonaPorIdGQL extends Query<Response> {
  document = personaQuery;
}
