import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { vehiculosSucursalSearchPageQuery } from './graphql-query';

export interface Response {
    data: any;
}

@Injectable({
    providedIn: 'root',
})
export class VehiculosSucursalSearchPageGQL extends Query<Response> {
    override document = vehiculosSucursalSearchPageQuery;
}
