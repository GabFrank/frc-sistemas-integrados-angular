import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { historialConfiguracionFacturacionQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetHistorialConfiguracionFacturacionGQL extends Query<any> {
    document = historialConfiguracionFacturacionQuery;
}
