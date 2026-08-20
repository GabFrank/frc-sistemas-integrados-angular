import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteCargoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class DeleteCargoGQL extends Mutation<Response> { document = deleteCargoQuery; }
