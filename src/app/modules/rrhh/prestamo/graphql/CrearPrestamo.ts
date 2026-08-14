import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Prestamo } from '../prestamo.model';
import { crearPrestamoMutation } from './graphql-query';

export interface Response { data: Prestamo; }

@Injectable({ providedIn: 'root' })
export class CrearPrestamoGQL extends Mutation<Response> { document = crearPrestamoMutation; }
