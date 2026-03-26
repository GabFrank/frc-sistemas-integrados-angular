import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Inmueble } from '../models/inmueble.model';
import { inmuebleByIdQuery } from './graphql-query';

export interface Response {
    data: Inmueble;
}

@Injectable({
    providedIn: 'root',
})
export class InmuebleByIdGQL extends Query<Response> {
    override document = inmuebleByIdQuery;
}
