import { Injectable } from "@angular/core";
import { requestPushNotificationQuery } from "./graphql-query";
import { Query } from "apollo-angular";

@Injectable({
  providedIn: "root",
})
export class RequestPushNotificationGQL extends Query<boolean> {
  document = requestPushNotificationQuery;
}
