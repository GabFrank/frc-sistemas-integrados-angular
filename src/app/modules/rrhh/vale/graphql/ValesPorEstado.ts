import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Vale } from '../vale.model';
import { valesPorEstadoQuery } from './graphql-query';

export interface Response { data: Vale[]; }

@Injectable({ providedIn: 'root' })
export class ValesPorEstadoGQL extends Query<Response> { document = valesPorEstadoQuery; }
