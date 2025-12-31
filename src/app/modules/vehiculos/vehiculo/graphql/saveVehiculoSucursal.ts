import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { VehiculoSucursal } from '../models/vehiculo-sucursal.model';
import { saveVehiculoSucursalMutation } from './graphql-query';

export interface Response {
    data: VehiculoSucursal;
}

@Injectable({
    providedIn: 'root',
})
export class SaveVehiculoSucursalGQL extends Mutation<Response> {
    override document = saveVehiculoSucursalMutation;
}

