import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Mueble } from '../models/mueble.model';
import { saveMuebleMutation } from './graphql-query';

export interface Response {
    data: Mueble;
}

@Injectable({
    providedIn: 'root',
})
export class SaveMuebleGQL extends Mutation<Response> {
    override document = saveMuebleMutation;
}
