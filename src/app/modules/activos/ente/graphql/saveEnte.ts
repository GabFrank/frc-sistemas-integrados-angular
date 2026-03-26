import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Ente } from '../models/ente.model';
import { saveEnteMutation } from './graphql-query';

export interface Response {
    data: Ente;
}

@Injectable({
    providedIn: 'root',
})
export class SaveEnteGQL extends Mutation<Response> {
    override document = saveEnteMutation;
}
