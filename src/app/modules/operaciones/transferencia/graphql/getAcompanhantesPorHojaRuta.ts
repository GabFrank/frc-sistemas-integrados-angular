import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Acompanhante } from '../transferencia.model';
import { acompanhantesPorHojaRutaQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetAcompanhantesPorHojaRutaGQL extends Query<Acompanhante[]> {
    document = acompanhantesPorHojaRutaQuery;
}
