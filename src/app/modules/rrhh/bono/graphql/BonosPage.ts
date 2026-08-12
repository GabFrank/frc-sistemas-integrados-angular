import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Bono } from '../bono.model';
import { bonosPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class BonosPageGQL extends Query<PageInfo<Bono>> { document = bonosPageQuery; }
