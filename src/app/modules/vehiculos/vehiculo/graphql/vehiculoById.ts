import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Vehiculo } from '../models/vehiculo.model';
import { vehiculoByIdQuery } from './graphql-query';

export interface Response {
    data: Vehiculo;
}

@Injectable({
    providedIn: 'root',
})
export class VehiculoByIdGQL extends Query<Response> {
    override document = vehiculoByIdQuery;
}
