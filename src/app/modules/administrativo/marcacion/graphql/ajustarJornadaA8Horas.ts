import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Jornada } from '../models/jornada.model';
import { ajustarJornadaA8HorasMutation } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class AjustarJornadaA8HorasGQL extends Mutation<{data: Jornada}> {
    document = ajustarJornadaA8HorasMutation;
}
