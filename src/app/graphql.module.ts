import {NgModule} from '@angular/core';
import {APOLLO_OPTIONS} from 'apollo-angular';
import {ApolloClientOptions, ApolloLink, InMemoryCache} from '@apollo/client/core';
import {HttpLink} from 'apollo-angular/http';
import { setContext } from '@apollo/client/link/context';
import { HttpHeaders } from '@angular/common/http';


const uri = 'http://localhost:8081/graphql'; // <-- add the URL of the GraphQL server here
export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  const basic = setContext((operation, context) => ({
    headers: {
      Accept: 'charset=utf-8'
    }
  }));
  const auth = new ApolloLink((operation: any, forward: any) => {
    console.log(localStorage.getItem("token"))
    operation.setContext({
      headers: new HttpHeaders().set(
        "Authorization",
        `Token ${localStorage.getItem("token")}` || null,
      ),
    });
  
    return forward(operation);
  });
  return {
    link: ApolloLink.from([basic, auth, httpLink.create({ uri, withCredentials: true})]),
    cache: new InMemoryCache(),
  
  };
}

@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {}
