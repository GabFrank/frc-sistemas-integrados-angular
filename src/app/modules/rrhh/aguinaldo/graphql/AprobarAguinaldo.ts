import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Aguinaldo } from '../aguinaldo.model';
import { aprobarAguinaldoMutation } from './graphql-query';

export interface Response { data: Aguinaldo; }

@Injectable({ providedIn: 'root' })
export class AprobarAguinaldoGQL extends Mutation<Response> { document = aprobarAguinaldoMutation; }
