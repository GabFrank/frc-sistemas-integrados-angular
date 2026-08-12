import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { documentoContenidoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class DocumentoContenidoGQL extends Query<Response> { document = documentoContenidoQuery; }
