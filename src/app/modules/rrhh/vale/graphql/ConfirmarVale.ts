import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Vale } from '../vale.model';
import { confirmarValeMutation } from './graphql-query';

export interface Response { data: Vale; }

@Injectable({ providedIn: 'root' })
export class ConfirmarValeGQL extends Mutation<Response> { document = confirmarValeMutation; }
