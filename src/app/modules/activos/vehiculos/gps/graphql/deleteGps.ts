import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteGpsMutation } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class DeleteGpsGQL extends Mutation<boolean> {
    override document = deleteGpsMutation;
}
