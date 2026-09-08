import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { BonoRecurrente } from '../bono-recurrente.model';
import { cambiarEstadoBonoRecurrenteMutation } from './graphql-query';

export interface Response { data: BonoRecurrente; }

@Injectable({ providedIn: 'root' })
export class CambiarEstadoBonoRecurrenteGQL extends Mutation<Response> { document = cambiarEstadoBonoRecurrenteMutation; }
