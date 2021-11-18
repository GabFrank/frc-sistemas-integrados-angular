import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Persona } from '../persona.model';
import { personaQuery, personasSearch, savePersona } from './graphql-query';

class Response {
  data: Persona
}

@Injectable({
  providedIn: 'root',
})
export class SavePersonaGQL extends Mutation<Response> {
  document = savePersona;
}
