import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';


@NgModule({
  imports: [
    HttpClientModule
  ]
})
export class GraphQLModule {

  private readonly URI1: string = 'http://first.endpoint.io/graphql';
  private readonly URI2: string = 'http://150.136.137.98:8081/graphql';

  constructor(
    // apollo: Apollo,
    // httpLink: HttpLink
  ) {
    // const options2: any = { uri: this.URI2 };
    // apollo.createNamed('endpoint2', {
    //   link: httpLink.create(options2),
    //   cache: new InMemoryCache()
    // });
  }
}
