import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { guardarConfigAlertasGpsMutation } from './graphql-query';
import { Gps } from '../models/gps.model';

export interface Response {
    data: Gps;
}

@Injectable({
    providedIn: 'root',
})
export class GuardarConfigAlertasGpsGQL extends Mutation<Response> {
    override document = guardarConfigAlertasGpsMutation;
}
