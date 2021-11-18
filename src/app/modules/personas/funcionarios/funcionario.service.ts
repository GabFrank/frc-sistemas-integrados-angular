import { Injectable, Type } from '@angular/core';
import { AllFuncionariosGQL } from './graphql/allFuncionarios';
import { FuncionarioInput } from './funcionario-input.model';
import { Observable } from 'rxjs';
import { Funcionario } from './funcionario.model';
import { GenericCrudService } from '../../../generics/generic-crud.service';

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {

  constructor(
    private genericCrud: GenericCrudService,
    private getAllFuncionarios: AllFuncionariosGQL
  ){}

  onGetAllFuncionarios(): Observable<Funcionario[]>{
    return this.genericCrud.onGetAll(this.getAllFuncionarios);
  }

  onGetFuncionarioById(id){

  }

  onSaveFuncionario(input: FuncionarioInput){

  }

  onDeleteFuncionario(id){

  }
}
