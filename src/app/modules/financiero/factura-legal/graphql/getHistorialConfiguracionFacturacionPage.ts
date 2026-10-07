import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { historialConfiguracionFacturacionPageQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetHistorialConfiguracionFacturacionPageGQL extends Query<any> {
    document = historialConfiguracionFacturacionPageQuery;
}
