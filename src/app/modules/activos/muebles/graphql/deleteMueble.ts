import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteMuebleMutation } from './graphql-query';

export interface Response {
    data: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class DeleteMuebleGQL extends Mutation<Response> {
    override document = deleteMuebleMutation;
}
