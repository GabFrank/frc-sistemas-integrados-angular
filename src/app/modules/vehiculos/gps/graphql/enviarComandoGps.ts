import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { enviarComandoGpsMutation } from './graphql-query';

export interface Response {
    data: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class EnviarComandoGpsGQL extends Mutation<Response> {
    override document = enviarComandoGpsMutation;
}
