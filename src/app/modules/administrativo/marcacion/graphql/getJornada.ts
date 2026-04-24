import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Jornada } from '../models/jornada.model';
import { jornadaQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetJornadaGQL extends Query<Jornada> {
    document = jornadaQuery;
}
