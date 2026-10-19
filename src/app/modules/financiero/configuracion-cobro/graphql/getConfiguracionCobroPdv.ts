import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { configuracionCobroPdvQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetConfiguracionCobroPdvGQL extends Query<any> {
    document = configuracionCobroPdvQuery;
}
