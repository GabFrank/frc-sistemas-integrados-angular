import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { finalizarVentaCreditosQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class FinalizarVentaCreditosGQL extends Mutation<boolean> {
    document = finalizarVentaCreditosQuery;
}
