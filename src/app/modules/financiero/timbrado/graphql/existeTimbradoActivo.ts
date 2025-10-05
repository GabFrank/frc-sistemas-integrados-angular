import { Query } from "apollo-angular";
import { existeTimbradoActivoQuery } from "./graphql-query";
import { Injectable } from "@angular/core";

export interface ExisteTimbradoActivoResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ExisteTimbradoActivoGQL extends Query<ExisteTimbradoActivoResponse> {
  document = existeTimbradoActivoQuery;
}
