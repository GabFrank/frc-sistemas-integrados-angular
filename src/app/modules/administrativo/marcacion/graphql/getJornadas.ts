import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Jornada } from '../models/jornada.model';
import { jornadasQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetJornadasGQL extends Query<Jornada[]> {
    document = jornadasQuery;
}
