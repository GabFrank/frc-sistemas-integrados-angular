import {
  HashLocationStrategy,
  LocationStrategy,
  registerLocaleData,
} from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import localePY from "@angular/common/locales/es-PY";
import {
  APP_INITIALIZER,
  CUSTOM_ELEMENTS_SCHEMA,
  LOCALE_ID,
  NgModule,
} from "@angular/core";
import { FlexLayoutModule } from "ngx-flexible-layout";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule } from "@angular/router";
import { APOLLO_OPTIONS, ApolloModule } from "apollo-angular";
import { HttpLink } from "apollo-angular/http";
import { NgxSpinnerModule } from "ngx-spinner";
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
import { NgxEchartsModule } from "ngx-echarts";
import { SucursalService } from "./modules/empresarial/sucursal/sucursal.service";
import { GraphqlConnectionService } from "./shared/services/graphql-connection.service";
import { BehaviorSubject } from "rxjs";

export const errorObs = new BehaviorSubject<any>(null);
export interface GraphQLResponse<T> {
  data: T | null | undefined;
  errors: any | null;
}

registerLocaleData(localePY);

export function appInit(appConfigService: MainService) {
  return () => {
    try {
      return appConfigService.load();
    } catch (error) {
      console.error('Error initializing application:', error);
      return Promise.resolve(true);
    }
  };
}

@NgModule({
  declarations: [
    AppComponent,
    DetailPopupComponent,
    FormatNumberPipe
  ],
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
    HttpClientModule,
    SharedModule,
    ApolloModule,
    NgxSpinnerModule,
    // Provider global de echarts para ngx-echarts. Sin esto, frc-grafico-shell
    // (y los dashboards que lo usan) solo renderiza dentro del modulo de graficos.
    NgxEchartsModule.forRoot({ echarts: () => import("echarts") })
  ],
  providers: [
    MainService,
    SucursalService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInit,
      deps: [MainService],
      multi: true,
    },
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink, graphqlService: GraphqlConnectionService) => {
        return graphqlService.createApolloOptions(httpLink);
      },
      deps: [HttpLink, GraphqlConnectionService],
    },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: LOCALE_ID, useValue: "es-PY" },
    { provide: MAT_DATE_LOCALE, useValue: "es-PY" },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
