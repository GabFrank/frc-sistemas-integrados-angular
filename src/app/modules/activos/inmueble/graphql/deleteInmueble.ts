import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteInmuebleMutation } from './graphql-query';

export interface Response {
    data: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class DeleteInmuebleGQL extends Mutation<Response> {
    override document = deleteInmuebleMutation;
}
