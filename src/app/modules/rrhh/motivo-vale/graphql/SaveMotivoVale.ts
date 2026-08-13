import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { MotivoVale } from '../motivo-vale.model';
import { saveMotivoValeMutation } from './graphql-query';

export interface Response { data: MotivoVale; }

@Injectable({ providedIn: 'root' })
export class SaveMotivoValeGQL extends Mutation<Response> { document = saveMotivoValeMutation; }
