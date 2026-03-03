import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Marcacion } from '../models/marcacion.model';
import { marcacionQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetMarcacionGQL extends Query<Marcacion> {
    document = marcacionQuery;
}
