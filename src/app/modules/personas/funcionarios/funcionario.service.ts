import { Injectable, Type } from "@angular/core";
import { AllFuncionariosGQL } from "./graphql/allFuncionarios";
import { FuncionarioInput } from "./funcionario-input.model";
import { Observable } from "rxjs";
import { Funcionario } from "./funcionario.model";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { SaveFuncionarioGQL } from "./graphql/saveFuncionario";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { FuncionarioSearchGQL } from "./graphql/funcionarioSearch";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class FuncionarioService {
  constructor(
    private genericCrud: GenericCrudService,
    private getAllFuncionarios: AllFuncionariosGQL,
    private saveFuncionario: SaveFuncionarioGQL,
    private notificacionBar: NotificacionSnackbarService,
    private searchFuncionario: FuncionarioSearchGQL
  ) {}

  onGetAllFuncionarios(): Observable<Funcionario[]> {
    return this.genericCrud.onGetAll(this.getAllFuncionarios);
  }

  onGetFuncionarioById(id) {}

  onFuncionarioSearch(texto: string): Observable<any> {
    return new Observable(obs => {
      this.searchFuncionario
      .fetch({ texto }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if(res.errors==null){
          obs.next(res.data.data)
        } else {
          console.log(res)
          obs.next(null)
        }
      });
    })
  }

  onSaveFuncionario(input: FuncionarioInput): Observable<Funcionario> {
    console.log(input);
    return new Observable((obs) => {
      if (input.id == null && input.usuarioId == null) {
        input.usuarioId = +localStorage.getItem("usuarioId");
      }
      this.saveFuncionario
        .mutate(
          {
            entity: input,
          },
          { errorPolicy: "all" }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          console.log(res.errors);
          if (res.errors == null) {
            obs.next(res.data.data);
            this.notificacionBar.notification$.next({
              texto: "Producto guardado con éxito",
              color: NotificacionColor.success,
              duracion: 2,
            });
          } else {
            obs.next(null);
            this.notificacionBar.notification$.next({
              texto: `Ups! Algo salió mal. ${res.errors[0].message}`,
              color: NotificacionColor.danger,
              duracion: 4,
            });
          }
        });
    });
  }

  onDeleteFuncionario(id) {}
}
