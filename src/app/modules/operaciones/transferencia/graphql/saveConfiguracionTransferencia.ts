import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveConfiguracionTransferencia } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class SaveConfiguracionTransferenciaGQL extends Mutation<any> {
    document = saveConfiguracionTransferencia;
}
