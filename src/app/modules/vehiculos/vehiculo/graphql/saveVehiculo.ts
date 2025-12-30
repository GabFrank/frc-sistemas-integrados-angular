import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Vehiculo } from '../models/vehiculo.model';
import { saveVehiculoMutation } from './graphql-query';

export interface Response {
    data: Vehiculo;
}

@Injectable({
    providedIn: 'root',
})
export class SaveVehiculoGQL extends Mutation<Response> {
    override document = saveVehiculoMutation;
}
