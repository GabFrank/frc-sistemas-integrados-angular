import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { cargoHistoricosQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CargoHistoricosGQL extends Query<Response> { document = cargoHistoricosQuery; }
