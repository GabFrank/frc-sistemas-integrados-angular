import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ConfiguracionesRrhhGQL } from './graphql/ConfiguracionesRrhh';
import { ConfiguracionesRrhhSearchGQL } from './graphql/ConfiguracionesRrhhSearch';
import { ConfiguracionesRrhhPageGQL } from './graphql/ConfiguracionesRrhhPage';
import { SaveConfiguracionRrhhGQL } from './graphql/SaveConfiguracionRrhh';
import { DeleteConfiguracionRrhhGQL } from './graphql/DeleteConfiguracionRrhh';
import {
  AjustarSalariosAlMinimoGQL,
  ConfiguracionRrhhHistoricoGQL,
  FuncionariosBajoSalarioMinimoGQL
} from './graphql/AjusteSalarioMinimo';
import { ConfiguracionRrhh } from './configuracion-rrhh.model';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionRrhhService {

  constructor(
    private genericService: GenericCrudService,
    private configuracionesRrhhGQL: ConfiguracionesRrhhGQL,
    private configuracionesRrhhSearchGQL: ConfiguracionesRrhhSearchGQL,
    private configuracionesRrhhPageGQL: ConfiguracionesRrhhPageGQL,
    private saveConfiguracionRrhhGQL: SaveConfiguracionRrhhGQL,
    private deleteConfiguracionRrhhGQL: DeleteConfiguracionRrhhGQL,
    private funcionariosBajoSalarioMinimoGQL: FuncionariosBajoSalarioMinimoGQL,
    private ajustarSalariosAlMinimoGQL: AjustarSalariosAlMinimoGQL,
    private configuracionRrhhHistoricoGQL: ConfiguracionRrhhHistoricoGQL
  ) { }

  /** TODO-8: funcionarios que quedan por debajo del nuevo minimo (vista previa). */
  onGetFuncionariosBajoMinimo(minimo: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.funcionariosBajoSalarioMinimoGQL, { minimo }, servidor);
  }

  /** Ajusta solo los funcionarios elegidos por el usuario. Nunca automatico. */
  onAjustarSalariosAlMinimo(funcionarioIds: number[], minimo: number,
                            usuarioId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.ajustarSalariosAlMinimoGQL,
      { funcionarioIds, minimo, usuarioId }, servidor);
  }

  onGetHistorico(clave: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.configuracionRrhhHistoricoGQL, { clave }, servidor);
  }

  onGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.configuracionesRrhhGQL, 0, 200, servidor);
  }

  onSearch(texto: string, servidor = true): Observable<any> {
    return this.genericService.onGetByTexto(this.configuracionesRrhhSearchGQL, texto, servidor);
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, texto?: string, tipo?: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.configuracionesRrhhPageGQL,
      { page, size, texto, tipo }, servidor);
  }

  onSave(input: any, servidor = true): Observable<ConfiguracionRrhh> {
    return this.genericService.onSave<ConfiguracionRrhh>(
      this.saveConfiguracionRrhhGQL, input, null, null, servidor
    );
  }

  onDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteConfiguracionRrhhGQL, id, null, null, false, servidor);
  }
}
