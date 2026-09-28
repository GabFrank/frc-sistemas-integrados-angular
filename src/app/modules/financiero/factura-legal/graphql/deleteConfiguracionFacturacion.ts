import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteConfiguracionFacturacion } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class DeleteConfiguracionFacturacionGQL extends Mutation<boolean> {
    document = deleteConfiguracionFacturacion;
}
