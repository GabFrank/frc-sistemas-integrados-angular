import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteEnteSucursalMutation } from './graphql-query';

export interface Response {
    data: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class DeleteEnteSucursalGQL extends Mutation<Response> {
    override document = deleteEnteSucursalMutation;
}
