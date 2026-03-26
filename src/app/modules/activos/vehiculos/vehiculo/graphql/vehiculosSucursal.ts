import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VehiculoSucursal } from '../models/vehiculo-sucursal.model';
import { vehiculosSucursalQuery } from './graphql-query';

export interface Response {
    data: VehiculoSucursal[];
}

@Injectable({
    providedIn: 'root',
})
export class VehiculosSucursalGQL extends Query<Response> {
    override document = vehiculosSucursalQuery;
}

