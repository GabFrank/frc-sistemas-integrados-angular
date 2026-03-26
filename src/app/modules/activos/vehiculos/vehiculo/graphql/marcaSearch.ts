import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Marca } from '../models/marca.model';
import { marcaSearchQuery } from './aux-graphql-query';

export interface Response {
    data: Marca[];
}

@Injectable({
    providedIn: 'root',
})
export class MarcaSearchGQL extends Query<Response> {
    override document = marcaSearchQuery;
}
