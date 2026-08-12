import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Vacacion } from '../vacacion.model';
import { vacacionesPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class VacacionesPageGQL extends Query<PageInfo<Vacacion>> { document = vacacionesPageQuery; }
