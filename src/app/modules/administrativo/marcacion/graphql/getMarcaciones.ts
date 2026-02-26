import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Marcacion } from '../models/marcacion.model';
import { marcacionesQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetMarcacionesGQL extends Query<Marcacion[]> {
    document = marcacionesQuery;
}
