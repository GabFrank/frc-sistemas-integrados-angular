import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Transferencia } from '../transferencia.model';
import { transferenciasPorHojaRutaQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetTransferenciasPorHojaRutaGQL extends Query<Transferencia[]> {
    document = transferenciasPorHojaRutaQuery;
}
