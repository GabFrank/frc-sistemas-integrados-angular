import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveCargoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class SaveCargoGQL extends Mutation<Response> { document = saveCargoQuery; }
