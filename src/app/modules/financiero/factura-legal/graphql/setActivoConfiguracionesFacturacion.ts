import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { setActivoConfiguracionesFacturacion } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class SetActivoConfiguracionesFacturacionGQL extends Mutation<any> {
    document = setActivoConfiguracionesFacturacion;
}
