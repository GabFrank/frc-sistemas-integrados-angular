import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { EnteSucursal } from '../models/ente-sucursal.model';
import { entesSucursalesByEnteIdQuery } from './graphql-query';

export interface Response {
    data: EnteSucursal[];
}

@Injectable({
    providedIn: 'root',
})
export class EntesSucursalesByEnteIdGQL extends Query<Response> {
    override document = entesSucursalesByEnteIdQuery;
}
