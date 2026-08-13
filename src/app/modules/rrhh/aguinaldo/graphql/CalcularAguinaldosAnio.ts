import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { calcularAguinaldosAnioMutation } from './graphql-query';

export interface Response { data: number; }

@Injectable({ providedIn: 'root' })
export class CalcularAguinaldosAnioGQL extends Mutation<Response> { document = calcularAguinaldosAnioMutation; }
