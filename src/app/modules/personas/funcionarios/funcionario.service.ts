import { Injectable, Type } from '@angular/core';
import { AllFuncionariosGQL } from './graphql/allFuncionarios';
import { FuncionarioInput } from './funcionario-input.model';
import { Observable } from 'rxjs';
import { Funcionario } from './funcionario.model';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { SaveFuncionarioGQL } from './graphql/saveFuncionario';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {

  constructor(
    private genericCrud: GenericCrudService,
    private getAllFuncionarios: AllFuncionariosGQL,
    private saveFuncionario: SaveFuncionarioGQL,
    private notificacionBar: NotificacionSnackbarService
  ){}

  onGetAllFuncionarios(): Observable<Funcionario[]>{
    return this.genericCrud.onGetAll(this.getAllFuncionarios);
  }

  onGetFuncionarioById(id){

  }

  onSaveFuncionario(input: FuncionarioInput): Observable<Funcionario>{
    console.log(input)
    return new Observable((obs) => {
      if(input.id == null && input.usuarioId == null){
        input.usuarioId = +localStorage.getItem("usuarioId");
      }
      this.saveFuncionario
        .mutate(
          {
            entity: input,
          },
          { errorPolicy: "all" }
        )
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

  onDeleteFuncionario(id){

  }
}
