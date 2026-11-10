import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { versionMinimaDesktopQuery } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class VersionMinimaDesktopGQL extends Query<Response> {
  document = versionMinimaDesktopQuery;
}
