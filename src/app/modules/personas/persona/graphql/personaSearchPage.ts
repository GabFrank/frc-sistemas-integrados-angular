import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Persona } from '../persona.model';
import { personaSearchPageQuery } from './graphql-query';

class Response {
  data: PageInfo<Persona>;
}

@Injectable({
  providedIn: 'root',
})
export class PersonaSearchPageGQL extends Query<Response> {
  document = personaSearchPageQuery;
}
