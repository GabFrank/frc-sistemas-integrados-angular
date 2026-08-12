import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { acreditacionPreviewQuery } from "./graphql-query";

@Injectable({ providedIn: "root" })
export class GetAcreditacionPreviewGQL extends Query<{ data: any }> {
  document = acreditacionPreviewQuery;
}
