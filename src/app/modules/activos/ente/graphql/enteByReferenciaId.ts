import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Ente } from '../models/ente.model';
import { enteByReferenciaIdQuery } from './graphql-query';

export interface Response {
    data: Ente;
}

@Injectable({
    providedIn: 'root',
})
export class EnteByReferenciaIdGQL extends Query<Response> {
    override document = enteByReferenciaIdQuery;
}
