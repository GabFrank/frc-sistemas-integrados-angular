import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { saveTipoVehiculoMutation } from './aux-graphql-query';

export interface Response {
    data: TipoVehiculo;
}

@Injectable({
    providedIn: 'root',
})
export class SaveTipoVehiculoGQL extends Mutation<Response> {
    override document = saveTipoVehiculoMutation;
}
