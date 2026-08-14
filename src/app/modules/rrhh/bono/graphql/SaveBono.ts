import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Bono } from '../bono.model';
import { saveBonoMutation } from './graphql-query';

export interface Response { data: Bono; }

@Injectable({ providedIn: 'root' })
export class SaveBonoGQL extends Mutation<Response> { document = saveBonoMutation; }
