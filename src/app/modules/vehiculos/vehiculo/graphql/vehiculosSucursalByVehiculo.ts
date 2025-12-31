import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VehiculoSucursal } from '../models/vehiculo-sucursal.model';
import { vehiculosSucursalByVehiculoQuery } from './graphql-query';

export interface Response {
    data: VehiculoSucursal[];
}

@Injectable({
    providedIn: 'root',
})
export class VehiculosSucursalByVehiculoGQL extends Query<Response> {
    override document = vehiculosSucursalByVehiculoQuery;
}

