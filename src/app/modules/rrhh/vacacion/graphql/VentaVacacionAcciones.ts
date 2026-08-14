import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularVentaVacacionMutation, aprobarVentaVacacionMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AprobarVentaVacacionGQL extends Mutation<Response> { document = aprobarVentaVacacionMutation; }

@Injectable({ providedIn: 'root' })
export class AnularVentaVacacionGQL extends Mutation<Response> { document = anularVentaVacacionMutation; }
