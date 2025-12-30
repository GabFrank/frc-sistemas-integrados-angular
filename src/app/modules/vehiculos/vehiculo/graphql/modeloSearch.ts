import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Modelo } from '../models/modelo.model';
import { modeloSearchQuery } from './aux-graphql-query';

export interface Response {
    data: Modelo[];
}

@Injectable({
    providedIn: 'root',
})
export class ModeloSearchGQL extends Query<Response> {
    override document = modeloSearchQuery;
}
