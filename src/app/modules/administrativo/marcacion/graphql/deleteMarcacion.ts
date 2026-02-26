import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteMarcacionMutation } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class DeleteMarcacionGQL extends Mutation<boolean> {
    document = deleteMarcacionMutation;
}
