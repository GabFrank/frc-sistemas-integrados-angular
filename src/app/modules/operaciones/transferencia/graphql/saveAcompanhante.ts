import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Acompanhante } from '../transferencia.model';
import { saveAcompanhante } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class SaveAcompanhanteGQL extends Mutation<Acompanhante> {
    document = saveAcompanhante;
}
