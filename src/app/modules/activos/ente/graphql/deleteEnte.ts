import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteEnteMutation } from './graphql-query';

export interface Response {
    data: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class DeleteEnteGQL extends Mutation<Response> {
    override document = deleteEnteMutation;
}
