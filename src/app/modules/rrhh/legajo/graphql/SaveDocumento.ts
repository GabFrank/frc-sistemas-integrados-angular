import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveDocumentoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class SaveDocumentoGQL extends Mutation<Response> { document = saveDocumentoMutation; }
