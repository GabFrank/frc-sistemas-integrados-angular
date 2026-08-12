import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Vale } from '../vale.model';
import { anularValeMutation } from './graphql-query';

export interface Response { data: Vale; }

@Injectable({ providedIn: 'root' })
export class AnularValeGQL extends Mutation<Response> { document = anularValeMutation; }
