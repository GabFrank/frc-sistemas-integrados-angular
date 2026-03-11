import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Marcacion } from '../models/marcacion.model';
import { saveMarcacionMutation } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class SaveMarcacionGQL extends Mutation<Marcacion> {
    document = saveMarcacionMutation;
}
