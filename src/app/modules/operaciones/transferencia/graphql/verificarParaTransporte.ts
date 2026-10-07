import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Transferencia } from '../transferencia.model';
import { verificarParaTransporte } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class VerificarParaTransporteGQL extends Mutation<Transferencia> {
    document = verificarParaTransporte;
}
