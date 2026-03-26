import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Inmueble } from '../models/inmueble.model';
import { saveInmuebleMutation } from './graphql-query';

export interface Response {
    data: Inmueble;
}

@Injectable({
    providedIn: 'root',
})
export class SaveInmuebleGQL extends Mutation<Response> {
    override document = saveInmuebleMutation;
}
