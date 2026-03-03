import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Marcacion } from '../models/marcacion.model';
import { marcacionesPorUsuarioQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetMarcacionesPorUsuarioGQL extends Query<Marcacion[]> {
    document = marcacionesPorUsuarioQuery;
}
