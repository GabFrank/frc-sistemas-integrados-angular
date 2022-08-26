import {NgModule} from '@angular/core';
import {Apollo, APOLLO_OPTIONS} from 'apollo-angular';
import {ApolloClientOptions, ApolloLink, InMemoryCache} from '@apollo/client/core';
import {HttpLink} from 'apollo-angular/http';
import { setContext } from '@apollo/client/link/context';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';


@NgModule({
  imports: [
    HttpClientModule
  ]
})
export class GraphQLModule {

  private readonly URI1: string = 'http://first.endpoint.io/graphql';
  private readonly URI2: string = 'http://150.136.137.98:8081/graphql';

  constructor(
    apollo: Apollo,
    httpLink: HttpLink
  ) {
    const options2: any = { uri: this.URI2 };
    apollo.createNamed('endpoint2', {
      link: httpLink.create(options2),
      cache: new InMemoryCache()
    });
  }
}
