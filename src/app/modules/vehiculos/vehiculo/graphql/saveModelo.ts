import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Modelo } from '../models/modelo.model';
import { saveModeloMutation } from './aux-graphql-query';

export interface Response {
    data: Modelo;
}

@Injectable({
    providedIn: 'root',
})
export class SaveModeloGQL extends Mutation<Response> {
    override document = saveModeloMutation;
}
