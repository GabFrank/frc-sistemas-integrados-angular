import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { JornadaHistorial } from '../models/jornada.model';
import { jornadasHistorialQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetJornadasHistorialGQL extends Query<JornadaHistorial> {
    document = jornadasHistorialQuery;
}
