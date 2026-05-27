import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Ente } from '../models/ente.model';
import { enteByIdQuery } from './graphql-query';

export interface Response {
    data: Ente;
}

@Injectable({
    providedIn: 'root',
})
export class EnteByIdGQL extends Query<Response> {
    override document = enteByIdQuery;
}
