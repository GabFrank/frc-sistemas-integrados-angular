import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Marca } from '../models/marca.model';
import { saveMarcaMutation } from './aux-graphql-query';

export interface Response {
    data: Marca;
}

@Injectable({
    providedIn: 'root',
})
export class SaveMarcaGQL extends Mutation<Response> {
    override document = saveMarcaMutation;
}
