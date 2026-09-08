import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { BonoRecurrente } from '../bono-recurrente.model';
import { saveBonoRecurrenteMutation } from './graphql-query';

export interface Response { data: BonoRecurrente; }

@Injectable({ providedIn: 'root' })
export class SaveBonoRecurrenteGQL extends Mutation<Response> { document = saveBonoRecurrenteMutation; }
