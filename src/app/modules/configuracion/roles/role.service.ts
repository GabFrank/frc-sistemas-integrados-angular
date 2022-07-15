import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { DeleteRoleGQL } from './graphql/deleteRole';
import { RoleByIdGQL } from './graphql/roleById';
import { RolesGQL } from './graphql/rolesQuery';
import { SaveRoleGQL } from './graphql/saveRole';
import { Role } from './role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  constructor(
    private getRole: RoleByIdGQL,
    private getRoles: RolesGQL,
    private saveRole: SaveRoleGQL,
    private deleteRole: DeleteRoleGQL,
    private genericCrud: GenericCrudService
  ) { }

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
}
