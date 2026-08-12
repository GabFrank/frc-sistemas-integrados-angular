import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { editarItemLiquidacionFinalMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class EditarItemLiquidacionFinalGQL extends Mutation<Response> { document = editarItemLiquidacionFinalMutation; }
