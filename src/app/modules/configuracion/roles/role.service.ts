import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { DeleteRoleGQL } from './graphql/deleteRole';
import { DeleteUsuarioRoleGQL } from './graphql/deleteUsuarioRole';
import { RoleByIdGQL } from './graphql/roleById';
import { RolesGQL } from './graphql/rolesQuery';
import { SaveRoleGQL } from './graphql/saveRole';
import { SaveUsuarioRoleGQL } from './graphql/saveUsuarioRole';
import { UsuarioRolePorUsuarioIdGQL } from './graphql/usuarioRolePorUsuarioId';
import { Role, UsuarioRole } from './role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private genericCrud: GenericCrudService

  constructor(
    private getRole: RoleByIdGQL,
    private getRoles: RolesGQL,
    private saveRole: SaveRoleGQL,
    private deleteRole: DeleteRoleGQL,
    private getUsuarioRolePorUsuarioId: UsuarioRolePorUsuarioIdGQL,
    private saveUsuarioRole: SaveUsuarioRoleGQL,
    private deleteUsuarioRole: DeleteUsuarioRoleGQL,
    private injector: Injector
  ) { 
    setTimeout(() => this.genericCrud = injector.get(GenericCrudService));
  }

  onGetRole(id): Observable<Role>{
    return this.genericCrud.onGetById(this.getRole, id)
  }

  onGetRoles(page?, size?): Observable<Role[]>{
    return this.genericCrud.onGetAll(this.getRoles, page, size)
  }

  onSaveRole(input): Observable<Role>{
    return this.genericCrud.onSave(this.saveRole, input)
  }

  onDeleteRole(id): Observable<boolean>{
    return this.genericCrud.onDelete(this.deleteRole, id)
  }

  onGetUsuarioRolePorUsuario(id): Observable<UsuarioRole[]>{
    return this.genericCrud.onGetById(this.getUsuarioRolePorUsuarioId, id)
  }

  onSaveUsuarioRole(input): Observable<UsuarioRole>{
    return this.genericCrud.onSave(this.saveUsuarioRole, input)
  }

  onDeleteUsuarioRole(id): Observable<boolean>{
    return this.genericCrud.onDelete(this.deleteUsuarioRole, id)
  }
}
