import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Mueble } from '../models/mueble.model';
import { muebleByIdQuery } from './graphql-query';

export interface Response {
    data: Mueble;
}

@Injectable({
    providedIn: 'root',
})
export class MuebleByIdGQL extends Query<Response> {
    override document = muebleByIdQuery;
}
