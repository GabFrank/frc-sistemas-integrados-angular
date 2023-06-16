import {
  HashLocationStrategy,
  LocationStrategy,
  registerLocaleData
} from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import localePY from "@angular/common/locales/es-PY";
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, LOCALE_ID, NgModule } from "@angular/core";
import { FlexLayoutModule } from "ngx-flexible-layout";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule } from "@angular/router";
import {
  ApolloClientOptions,
  ApolloLink,
  InMemoryCache,
  split
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { APOLLO_OPTIONS, ApolloModule } from "apollo-angular";
import { HttpLink } from "apollo-angular/http";
import { NgxSpinnerModule } from "ngx-spinner";
import { BehaviorSubject } from "rxjs";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { environment } from "../environments/environment";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BootstrapModule } from "./commons/core/bootstrap.module";
import { MaterialModule } from "./commons/core/material.module";
import { DefaultModule } from "./layouts/default/default.module";
import { DetailPopupComponent } from "./layouts/detail-popup/detail-popup.component";
import { MainService } from "./main.service";
import { ModulesModule } from "./modules/modules.module";
import { FormatNumberPipe } from "./pipes/format-number.pipe";
import { SharedModule } from "./shared/shared.module";
import { SucursalService } from "./modules/empresarial/sucursal/sucursal.service";

export const errorObs = new BehaviorSubject<any>(null);
export const connectionStatusSub = new BehaviorSubject<any>(null);

// error handling
const errorLink = onError(({ graphQLErrors, networkError }) => {
  console.log(graphQLErrors, networkError);
  // if (graphQLErrors)
  //   graphQLErrors.map(({ message, locations, path }) =>
  //     errorObs.next({message, locations, path})
  //     console.log(
  //       `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
  //     ),
  //   );

  // if (networkError) console.log(`[Network error]: ${networkError}`);
});

// export function createNamed(httpLink: HttpLink): Record<string, ApolloClientOptions<any>> {
//   const url = `http://localhost:8081/graphql`;
//   const wUri = `ws://${environment['serverIp']}:${environment['serverPort']}/subscriptions`;

//   const wsClient = new SubscriptionClient(wUri, {
//     reconnect: true,
//   });


//   wsClient.onConnected(() => {
//     connectionStatusSub.next(true);
//     console.log("websocket connected!!");
//   });
//   wsClient.onDisconnected(() => {
//     if (connectionStatusSub.value != false) {
//       connectionStatusSub.next(false);
//     }
//     console.log("websocket disconnected!!");
//   });
//   wsClient.onReconnected(() => {
//     connectionStatusSub.next(true);
//     console.log("websocket reconnected!!");
//   });

//   const basic = setContext((operation, context) => ({
//     // headers: {
//     //   Accept: 'charset=utf-8'
//     // }
//   }));

//   const auth = setContext((operation, context) => {
//     const token = localStorage.getItem("token");
//     if (token === null) {
//       return {};
//     } else {
//       return {
//         headers: {
//           Authorization: `Token ${token}`,
//         },
//       };
//     }
//   });

//   // Create an http link:
//   const http = ApolloLink.from([
//     basic,
//     auth,
//     httpLink.create({
//       uri: url,
//     }),
//   ]);

//   // Create a WebSocket link:
//   // const ws = new WebSocketLink(wsClient);

//   // using the ability to split links, you can send data to each link
//   // depending on what kind of operation is being sent
//   const link = errorLink.concat(
//     split(
//       // split based on operation type

//       ({ query }) => {
//         const definition = getMainDefinition(query);
//         return (
//           definition.kind === "OperationDefinition" &&
//           definition.operation === "subscription"
//         );
//       },
//       // ws,
//       http
//     )
//   );

//   return {
//     servidor: {
//       name: 'servidor',
//       link,
//       cache: new InMemoryCache(),
//     }
//   }
// }

const customFetch = (uri, options) => {
  const { timeout = 10000 } = options; // Set the default timeout in milliseconds, e.g., 10 seconds
  return Promise.race([
    fetch(uri, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};

registerLocaleData(localePY);

export function appInit(appConfigService: MainService) {
  return () => appConfigService.load();
}
@NgModule({
  declarations: [AppComponent, DetailPopupComponent, FormatNumberPipe],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DefaultModule,
    ModulesModule,
    MaterialModule,
    FlexLayoutModule,
    BootstrapModule,
    RouterModule,
    AppRoutingModule,
    HttpClientModule,
    NgxSpinnerModule,
    SharedModule,
    ApolloModule
  ],
  providers: [
    [
      MainService,
      SucursalService,
      {
        provide: APP_INITIALIZER,
        useFactory: appInit,
        deps: [MainService],
        multi: true
      },
    ],
    {
      provide: APOLLO_OPTIONS,
      useFactory(httpLink: HttpLink): ApolloClientOptions<any> {
        const url = `http://${environment['serverIp']}:${environment['serverPort']}/graphql`;
        const url2 = `http://${environment['serverCentralIp']}:${environment['serverCentralPort']}/graphql`;
        const wUri = `ws://${environment['serverIp']}:${environment['serverPort']}/subscriptions`;
        const wUri2 = `ws://${environment['serverCentralIp']}:${environment['serverCentralPort']}/subscriptions`;

        const basic = setContext((operation, context) => ({
          // headers: {
          //   Accept: 'charset=utf-8'
          // }
        }));

        const auth = setContext((operation, context) => {
          const token = localStorage.getItem("token");
          if (token === null) {
            return {};
          } else {
            return {
              headers: {
                Authorization: `Token ${token}`,
              },
            };
          }
        });

        // Create an http link:
        const http = ApolloLink.from([
          basic,
          auth,
          httpLink.create({
            uri: url,
          }),
        ]);

        const http2 = ApolloLink.from([
          basic,
          auth,
          httpLink.create({
            uri: url2
          })
        ]);

        const wsClient = new SubscriptionClient(wUri,
          {
            reconnect: true
          }
        );

        const wsClient2 = new SubscriptionClient(wUri2,
          {
            reconnect: true,
            lazy: true
          }
        );

        wsClient.onConnected(() => {
          connectionStatusSub.next(true);
          // console.log("websocket connected!!");
        });
        wsClient.onDisconnected(() => {
          if (connectionStatusSub.value != false) {
            connectionStatusSub.next(false);
          }
          // console.log("websocket disconnected!!");
        });
        wsClient.onReconnected(() => {
          connectionStatusSub.next(true);
          // console.log("websocket reconnected!!");
        });

        // Create a WebSocket link:
        const ws = new WebSocketLink(wsClient);
        const ws2 = new WebSocketLink(wsClient2);
        // using the ability to split links, you can send data to each link
        // depending on what kind of operation is being sent
        const link = errorLink.concat(
          split(
            // split based on operation type

            ({ query }) => {
              const definition = getMainDefinition(query);
              return (
                definition.kind === "OperationDefinition" &&
                definition.operation === "subscription"
              );
            },
            ApolloLink.split(
              operation => operation.getContext().clientName === 'servidor',
              ws2,
              ws
            ),
            ApolloLink.split(
              operation => operation.getContext().clientName === 'servidor',
              http2,
              http
            )
          )
        );

        return {
          link,
          cache: new InMemoryCache(),
        };
      },
      deps: [HttpLink],
    },
    // {
    //   provide: APOLLO_NAMED_OPTIONS,
    //   useFactory: createNamed,
    //   deps: [HttpLink],
    // },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: LOCALE_ID, useValue: "es-PY" },
    { provide: MAT_DATE_LOCALE, useValue: "es-PY" },
    // { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { scrollStrategy: new NoopScrollStrategy() } }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {

  }
}
