import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReporteMarcacionesQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class ImprimirReporteMarcacionesGQL extends Query<string> {
    document = imprimirReporteMarcacionesQuery;
}
