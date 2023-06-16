import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import {
  NotificacionSnackbarService
} from "../../../notificacion-snackbar.service";
import { CargandoDialogService } from './../../../shared/components/cargando-dialog/cargando-dialog.service';
import { FuncionarioInput } from "./funcionario-input.model";
import { Funcionario } from "./funcionario.model";
import { AllFuncionariosGQL } from "./graphql/allFuncionarios";
import { FuncionarioSearchGQL } from "./graphql/funcionarioSearch";
import { SaveFuncionarioGQL } from "./graphql/saveFuncionario";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { environment } from '../../../../environments/environment';
import { DeletePreRegistroFuncionarioGQL } from "./graphql/graphql-pre-funcionario/deletePreRegistroFuncionario";
import { PreRegistroFuncionarioByIdGQL } from "./graphql/graphql-pre-funcionario/preRegistroFuncionarioById";
import { PreRegistroFuncionariosGQL } from "./graphql/graphql-pre-funcionario/preRegistroFuncionariosQuery";
import { SavePreRegistroFuncionarioGQL } from "./graphql/graphql-pre-funcionario/savePreRegistroFuncionario";
import { PreRegistroFuncionario } from './pre-registro-funcionario.model';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class FuncionarioService {
  constructor(
    private http: HttpClient,
    private genericCrud: GenericCrudService,
    private getAllFuncionarios: AllFuncionariosGQL,
    private saveFuncionario: SaveFuncionarioGQL,
    private notificacionBar: NotificacionSnackbarService,
    private searchFuncionario: FuncionarioSearchGQL,
    private getPreRegistroFuncionario: PreRegistroFuncionarioByIdGQL,
    private savePreRegistroFuncionario: SavePreRegistroFuncionarioGQL,
    private deletePreRegistroFuncionario: DeletePreRegistroFuncionarioGQL,
    private cargandoService: CargandoDialogService,
    private preRegistroFuncionarios: PreRegistroFuncionariosGQL

  ) {}

  onGetAllFuncionarios(page?): Observable<Funcionario[]> {
    return this.genericCrud.onGetAll(this.getAllFuncionarios, page);
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
          obs.next(null)
        }
      });
    })
  }

  onSaveFuncionario(input: FuncionarioInput): Observable<Funcionario> {
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
          if (res.errors == null) {
            obs.next(res.data.data);
            this.notificacionBar.openGuardadoConExito()
          } else {
            obs.next(null);
            this.notificacionBar.openAlgoSalioMal(res.errors[0].message)
          }
        });
    });
  }

  onDeleteFuncionario(id) {}

  onGetPreRegistroFuncionario(id): Observable<PreRegistroFuncionario> {
    return this.genericCrud.onGetById(this.getPreRegistroFuncionario, id);
  }

  // onGetPreRegistroFuncionarioes(sucursalId: number): Observable<PreRegistroFuncionario[]> {
  //   return this.genericCrud.onGetById(this.getPreRegistroFuncionarioes, sucursalId);
  // }

  onSavePreRegistroFuncionario(input): Observable<boolean> {
    this.cargandoService.openDialog()
    let httpOptions = {
      headers: new HttpHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
    };

    return new Observable(obs => {
      this.http.post<PreRegistroFuncionario>(
        `http://${environment['serverIp']}:${environment['serverPort']}/config/pre-registro`,
        input,
        httpOptions
      ).pipe(untilDestroyed(this)).subscribe(res => {
        this.cargandoService.closeDialog()
        if(res?.id!=null){
          obs.next(true)
          this.notificacionBar.openGuardadoConExito()
        } else {
          obs.next(false)
        }
      })
    })
  }

  onSavePreRegistroFuncionarioGraphql(input): Observable<boolean> {
    return this.genericCrud.onSave(this.savePreRegistroFuncionario, input)
  }

  onDeletePreRegistroFuncionario(id): Observable<boolean> {
    return this.genericCrud.onDelete(this.deletePreRegistroFuncionario, id)
  }

  onGetAllPreRegistroFuncionarios(page?): Observable<PreRegistroFuncionario[]>{
    return this.genericCrud.onGetAll(this.preRegistroFuncionarios, page)
  }
}
