import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteVehiculoMutation } from './graphql-query';

export interface Response {
    data: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class DeleteVehiculoGQL extends Mutation<Response> {
    override document = deleteVehiculoMutation;
}
