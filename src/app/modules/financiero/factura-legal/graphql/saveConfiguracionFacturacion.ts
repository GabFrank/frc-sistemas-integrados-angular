import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveConfiguracionFacturacion } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class SaveConfiguracionFacturacionGQL extends Mutation<any> {
    document = saveConfiguracionFacturacion;
}
