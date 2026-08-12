import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularDocumentoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AnularDocumentoGQL extends Mutation<Response> { document = anularDocumentoMutation; }
