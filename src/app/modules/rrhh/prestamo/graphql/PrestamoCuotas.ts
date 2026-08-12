import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PrestamoCuota } from '../prestamo.model';
import { prestamoCuotasQuery } from './graphql-query';

export interface Response { data: PrestamoCuota[]; }

@Injectable({ providedIn: 'root' })
export class PrestamoCuotasGQL extends Query<Response> { document = prestamoCuotasQuery; }
