import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { configuracionesFacturacionQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetConfiguracionesFacturacionGQL extends Query<any> {
    document = configuracionesFacturacionQuery;
}
