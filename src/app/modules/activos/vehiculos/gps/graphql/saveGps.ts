import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Gps } from '../models/gps.model';
import { saveGpsMutation } from './graphql-query';

export interface Response {
    data: Gps;
}

@Injectable({
    providedIn: 'root',
})
export class SaveGpsGQL extends Mutation<Response> {
    override document = saveGpsMutation;
}
