import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveConfiguracionCobro } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class SaveConfiguracionCobroGQL extends Mutation<any> {
    document = saveConfiguracionCobro;
}
