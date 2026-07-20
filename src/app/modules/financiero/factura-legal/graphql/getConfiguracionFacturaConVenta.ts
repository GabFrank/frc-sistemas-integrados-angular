import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { configuracionFacturaConVentaQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetConfiguracionFacturaConVentaGQL extends Query<any> {
    document = configuracionFacturaConVentaQuery;
}
