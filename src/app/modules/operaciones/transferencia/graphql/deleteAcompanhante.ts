import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteAcompanhante } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class DeleteAcompanhanteGQL extends Mutation<boolean> {
    document = deleteAcompanhante;
}
