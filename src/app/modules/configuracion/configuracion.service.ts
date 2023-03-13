import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Subscription } from "apollo-angular";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { GenericCrudService } from "../../generics/generic-crud.service";
import { SincEstadoGQL } from "./graphql/sinc-estado-sub";
import { SolicitarResourcesGQL } from "./graphql/solicitar-resources";

@Injectable({
  providedIn: "root",
})
export class ConfiguracionService {
  constructor(
    private genericService: GenericCrudService,
    private http: HttpClient,
    private sincSub: SincEstadoGQL,
    private onSolicitarResources: SolicitarResourcesGQL
    ) { }

  httpOptions = {
    headers: new HttpHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
  };

  getSucursalesAdmin(): Observable<any> {
    return new Observable((obs) => {
      let httpBody = {
        nickname: "ADMIN",
        password: "ADMIN",
      };
      let httpResponse = this.http
        .post(
          `http://${environment['serverIp']}:${environment['serverPort']}/config/sucursales`,
          httpBody,
          this.httpOptions
        )
        .subscribe(
          (res) => {
            obs.next(res);
          },
          (error) => {
            obs.next(error);
          }
        );
    });
  }

  onVerificarConexion(): Observable<any> {
    return new Observable((obs) => {
      let httpBody = {
        nickname: "ADMIN",
        password: "ADMIN",
      };
      let httpResponse = this.http
        .post(
          `http://${environment['serverIp']}:${environment['serverPort']}/config/verificar`,
          httpBody,
          this.httpOptions
        )
        .subscribe(
          (res) => {
            obs.next(res);
          },
          (error) => {
            obs.next(error);
          }
        );
    });
  }

  onSolicitarSincronizacion(): Observable<any> {
    return new Observable((obs) => {
      let httpBody = {
        nickname: "ADMIN",
        password: "ADMIN",
      };
      let httpResponse = this.http
        .post(
          `http://${environment['serverIp']}:${environment['serverPort']}/config/solicitardb`,
          httpBody,
          this.httpOptions
        )
        .subscribe(
          (res) => {
            obs.next(res);
          },
          (error) => {
            obs.next(error);
          }
        );
    });
  }

  isConfigured(): Observable<any> {
    return new Observable((obs) => {
      let httpBody = {
        nickname: "ADMIN",
        password: "ADMIN",
      };
      let httpResponse = this.http
        .post(
          `http://${environment['serverIp']}:${environment['serverPort']}/config/isconfigured`,
          httpBody,
          this.httpOptions
        )
        .subscribe(
          (res) => {
            obs.next(res);
          },
          (error) => {
            obs.next(error);
          }
        );
    });
  }

  onStatusSub(): Subscription {
    return this.sincSub
  }

  solicitarResources(){
    return this.genericService.onGetAll(this.onSolicitarResources)
  }

  // this.deliverySub = this.getDeliverySub.subscribe((res) => {
  //   let delivery = res.data.deliverys;
  //   let index = this.deliverysActivos.findIndex((d) => d.id == delivery.id);
  //   if (index != -1) {
  //     this.deliverysActivos[index] = delivery;
  //   } else {
  //     this.deliverysActivos.push(delivery);
  //     this.deliverysActivosSub.next(this.deliverysActivos);
  //   }
  // }); isconfigured
}
