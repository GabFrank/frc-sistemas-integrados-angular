import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteVehiculoSucursalMutation } from './graphql-query';

export interface Response {
    data: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class DeleteVehiculoSucursalGQL extends Mutation<Response> {
    override document = deleteVehiculoSucursalMutation;
}

