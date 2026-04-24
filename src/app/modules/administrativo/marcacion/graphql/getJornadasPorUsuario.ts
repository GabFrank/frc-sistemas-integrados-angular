import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Jornada } from '../models/jornada.model';
import { jornadasPorUsuarioQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetJornadasPorUsuarioGQL extends Query<Jornada[]> {
    document = jornadasPorUsuarioQuery;
}
