import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveConfiguracionFacturaConVenta } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class SaveConfiguracionFacturaConVentaGQL extends Mutation<any> {
    document = saveConfiguracionFacturaConVenta;
}
