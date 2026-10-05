import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { terminalObligatoriaVentaTarjetaQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetTerminalObligatoriaVentaTarjetaGQL extends Query<any> {
    document = terminalObligatoriaVentaTarjetaQuery;
}
