import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { configuracionCobroPdvCompletaQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetConfiguracionCobroPdvCompletaGQL extends Query<any> {
    document = configuracionCobroPdvCompletaQuery;
}
