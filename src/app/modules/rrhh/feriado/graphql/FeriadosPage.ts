import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Feriado } from '../feriado.model';
import { feriadosPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class FeriadosPageGQL extends Query<PageInfo<Feriado>> { document = feriadosPageQuery; }
