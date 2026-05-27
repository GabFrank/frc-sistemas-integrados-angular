import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from '../../../personas/persona/persona.model';
import { choferesConEntregasQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetChoferesConEntregasGQL extends Query<Persona[]> {
    document = choferesConEntregasQuery;
}
