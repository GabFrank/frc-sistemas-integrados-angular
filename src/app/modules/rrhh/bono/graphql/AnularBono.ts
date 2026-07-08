import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Bono } from '../bono.model';
import { anularBonoMutation } from './graphql-query';

export interface Response { data: Bono; }

@Injectable({ providedIn: 'root' })
export class AnularBonoGQL extends Mutation<Response> { document = anularBonoMutation; }
