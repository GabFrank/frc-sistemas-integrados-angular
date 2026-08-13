import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Aguinaldo } from '../aguinaldo.model';
import { pagarAguinaldoMutation } from './graphql-query';

export interface Response { data: Aguinaldo; }

@Injectable({ providedIn: 'root' })
export class PagarAguinaldoGQL extends Mutation<Response> { document = pagarAguinaldoMutation; }
