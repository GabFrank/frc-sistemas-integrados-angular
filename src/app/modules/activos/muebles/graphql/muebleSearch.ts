import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Mueble } from '../models/mueble.model';
import { muebleSearchQuery } from './graphql-query';

export interface Response {
    data: Mueble[];
}

@Injectable({
    providedIn: 'root',
})
export class MuebleSearchGQL extends Query<Response> {
    override document = muebleSearchQuery;
}
