import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Jornada } from '../models/jornada.model';
import { guardarObservacionJornadaMutation } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GuardarObservacionJornadaGQL extends Mutation<{data: Jornada}> {
    document = guardarObservacionJornadaMutation;
}
