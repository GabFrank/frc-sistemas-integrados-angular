import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VehiculoSucursal } from '../models/vehiculo-sucursal.model';
import { vehiculosSucursalBySucursalQuery } from './graphql-query';

export interface Response {
    data: VehiculoSucursal[];
}

@Injectable({
    providedIn: 'root',
})
export class VehiculosSucursalBySucursalGQL extends Query<Response> {
    override document = vehiculosSucursalBySucursalQuery;
}

