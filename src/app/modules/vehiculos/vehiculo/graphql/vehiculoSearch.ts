import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Vehiculo } from '../models/vehiculo.model';
import { vehiculosSearchWithPageQuery } from './graphql-query';

export interface Response {
    data: Vehiculo[];
}

@Injectable({
    providedIn: 'root',
})
export class VehiculoSearchGQL extends Query<Response> {
    override document = vehiculosSearchWithPageQuery;
}
