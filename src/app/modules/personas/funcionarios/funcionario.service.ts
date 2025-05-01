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
import { FuncionariosWithPageGQL } from './graphql/funcionarios-with-page';
import { PageInfo } from '../../../app.component';
import { FuncionarioPorPersonaIdGQL } from './graphql/funcionarioPorPersonaId';
import { FuncionarioByIdGQL } from './graphql/funcionarioById';

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
    private preRegistroFuncionarios: PreRegistroFuncionariosGQL,
    private funcionariosWithPage: FuncionariosWithPageGQL,
    private funcionarioPorPersona: FuncionarioPorPersonaIdGQL,
    private funcionarioById: FuncionarioByIdGQL
  ) { }

  onGetAllFuncionarios(page?, size?, servidor = true): Observable<Funcionario[]> {
    return this.genericCrud.onGetAll(this.getAllFuncionarios, page, size, servidor);
  }

  onGetFuncionarioById(id, servidor = true): Observable<Funcionario> { 
    return this.genericCrud.onGetById(this.funcionarioById, id, null, null, servidor);
  }

  onFuncionarioSearch(texto: string, servidor = true): Observable<any> {
    //refactor using genericcrud
    return this.genericCrud.onCustomQuery(this.searchFuncionario, { texto }, servidor);
  }

  onSaveFuncionario(input: FuncionarioInput, servidor = true): Observable<Funcionario> {
    return this.genericCrud.onSave(this.saveFuncionario, input, null, null, servidor);
  }

  // onDeleteFuncionario(id, servidor = true) {
  //   return this.genericCrud.onDelete(this.deleteFuncionario, id, servidor);
  // }

  onGetPreRegistroFuncionario(id, servidor = true): Observable<PreRegistroFuncionario> {
    return this.genericCrud.onGetById(this.getPreRegistroFuncionario, id, null, null, servidor);
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
        if (res?.id != null) {
          obs.next(true)
          this.notificacionBar.openGuardadoConExito()
        } else {
          obs.next(false)
        }
      })
    })
  }

  onSavePreRegistroFuncionarioGraphql(input, servidor = true): Observable<boolean> {
    return this.genericCrud.onSave(this.savePreRegistroFuncionario, input, null, null, servidor)
  }

  onDeletePreRegistroFuncionario(id, servidor = true): Observable<boolean> {
    return this.genericCrud.onDelete(this.deletePreRegistroFuncionario, id, "¿Eliminar pre registro de funcionario?", null, true, servidor, "¿Está seguro que desea eliminar este pre registro de funcionario?");
  }

  onGetAllPreRegistroFuncionarios(page?, size?, servidor = true): Observable<PreRegistroFuncionario[]> {
    return this.genericCrud.onGetAll(this.preRegistroFuncionarios, page, size, servidor)
  }

  onGetAllWithPage(page?, size?, id?, nombre?, sucursalIdList?, servidor = true): Observable<PageInfo<Funcionario>> {
    return this.genericCrud.onCustomQuery(this.funcionariosWithPage, { page, size, id, nombre, sucursalIdList }, servidor);
  }

  onGetFuncionarioPorPersona(id, servidor = true): Observable<Funcionario> {
    return this.genericCrud.onGetById(this.funcionarioPorPersona, id, null, null, servidor);
  }
}
