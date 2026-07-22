import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Prestamo } from '../prestamo.model';
import { prestamosPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class PrestamosPageGQL extends Query<PageInfo<Prestamo>> { document = prestamosPageQuery; }
