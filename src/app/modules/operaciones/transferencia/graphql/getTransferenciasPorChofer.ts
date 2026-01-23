import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Transferencia } from '../transferencia.model';
import { transferenciasPorChoferQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetTransferenciasPorChoferGQL extends Query<Transferencia[]> {
    document = transferenciasPorChoferQuery;
}
