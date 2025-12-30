import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { tipoVehiculoSearchQuery } from './aux-graphql-query';

export interface Response {
    data: TipoVehiculo[];
}

@Injectable({
    providedIn: 'root',
})
export class TipoVehiculoSearchGQL extends Query<Response> {
    override document = tipoVehiculoSearchQuery;
}
