import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { EnteSucursal } from '../models/ente-sucursal.model';
import { saveEnteSucursalMutation } from './graphql-query';

export interface Response {
    data: EnteSucursal;
}

@Injectable({
    providedIn: 'root',
})
export class SaveEnteSucursalGQL extends Mutation<Response> {
    override document = saveEnteSucursalMutation;
}
