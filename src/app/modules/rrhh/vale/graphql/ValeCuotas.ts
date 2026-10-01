import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ValeCuota } from '../vale.model';
import { valeCuotasQuery } from './graphql-query';

export interface Response { data: ValeCuota[]; }

@Injectable({ providedIn: 'root' })
export class ValeCuotasGQL extends Query<Response> { document = valeCuotasQuery; }
