import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { HojaRuta } from '../transferencia.model';
import { hojasRutaConEntregasQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetHojasRutaConEntregasGQL extends Query<HojaRuta[]> {
    document = hojasRutaConEntregasQuery;
}
