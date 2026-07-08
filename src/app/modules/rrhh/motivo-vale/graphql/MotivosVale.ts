import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { MotivoVale } from '../motivo-vale.model';
import { motivosValeQuery } from './graphql-query';

export interface Response { data: MotivoVale[]; }

@Injectable({ providedIn: 'root' })
export class MotivosValeGQL extends Query<Response> { document = motivosValeQuery; }
