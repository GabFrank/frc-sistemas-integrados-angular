import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Gps } from '../models/gps.model';
import { gpsByImeiQuery } from './graphql-query';

export interface Response {
    data: Gps;
}

@Injectable({
    providedIn: 'root',
})
export class GpsByImeiGQL extends Query<Response> {
    override document = gpsByImeiQuery;
}
