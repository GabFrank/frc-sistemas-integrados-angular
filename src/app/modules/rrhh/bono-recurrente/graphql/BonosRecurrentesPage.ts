import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { BonoRecurrente } from '../bono-recurrente.model';
import { bonosRecurrentesPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class BonosRecurrentesPageGQL extends Query<PageInfo<BonoRecurrente>> { document = bonosRecurrentesPageQuery; }
