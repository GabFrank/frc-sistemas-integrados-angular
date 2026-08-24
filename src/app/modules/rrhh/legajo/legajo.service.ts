import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CargoHistoricosGQL } from './graphql/CargoHistoricos';
import { SalarioHistoricosGQL } from './graphql/SalarioHistoricos';
import { DocumentosGQL } from './graphql/Documentos';
import { DocumentoContenidoGQL } from './graphql/DocumentoContenido';
import { CambiarCargoGQL } from './graphql/CambiarCargo';
import { CambiarSalarioGQL } from './graphql/CambiarSalario';
import { EgresarFuncionarioGQL } from './graphql/EgresarFuncionario';
import { RevertirEgresoFuncionarioGQL } from './graphql/RevertirEgresoFuncionario';
import { EgresoVigenteGQL } from './graphql/EgresoVigente';
import { SaveDocumentoGQL } from './graphql/SaveDocumento';
import { AnularDocumentoGQL } from './graphql/AnularDocumento';

@Injectable({ providedIn: 'root' })
export class LegajoService {

  constructor(
    private genericService: GenericCrudService,
    private cargoHistoricosGQL: CargoHistoricosGQL,
    private salarioHistoricosGQL: SalarioHistoricosGQL,
    private documentosGQL: DocumentosGQL,
    private documentoContenidoGQL: DocumentoContenidoGQL,
    private cambiarCargoGQL: CambiarCargoGQL,
    private cambiarSalarioGQL: CambiarSalarioGQL,
    private egresarFuncionarioGQL: EgresarFuncionarioGQL,
    private revertirEgresoFuncionarioGQL: RevertirEgresoFuncionarioGQL,
    private egresoVigenteGQL: EgresoVigenteGQL,
    private saveDocumentoGQL: SaveDocumentoGQL,
    private anularDocumentoGQL: AnularDocumentoGQL
  ) { }

  onGetCargoHistoricos(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.cargoHistoricosGQL, { funcionarioId }, servidor);
  }

  onGetSalarioHistoricos(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.salarioHistoricosGQL, { funcionarioId }, servidor);
  }

  onGetDocumentos(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.documentosGQL, { funcionarioId }, servidor);
  }

  onGetDocumentoContenido(id: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.documentoContenidoGQL, { id }, servidor);
  }

  onCambiarCargo(input: any, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.cambiarCargoGQL, { input }, servidor);
  }

  onCambiarSalario(input: any, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.cambiarSalarioGQL, { input }, servidor);
  }

  onEgresar(funcionarioId: number, fecha: string, motivo: string, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.egresarFuncionarioGQL, { funcionarioId, fecha, motivo }, servidor);
  }

  /**
   * Snapshot del egreso vigente, para precargar el credito en la reversa. Devuelve null
   * si el egreso es anterior al historico: ahi hay que cargarlo a mano.
   */
  onGetEgresoVigente(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.egresoVigenteGQL, { funcionarioId }, servidor);
  }

  /**
   * Revierte un egreso. El credito viaja como parametro porque el egreso lo pone en cero
   * y no queda guardado en ninguna tabla: sin el valor, el backend no puede recuperarlo.
   */
  onRevertirEgreso(funcionarioId: number, credito: number, motivo: string, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.revertirEgresoFuncionarioGQL, { funcionarioId, credito, motivo }, servidor);
  }

  onSaveDocumento(input: any, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.saveDocumentoGQL, { input }, servidor);
  }

  onAnularDocumento(id: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.anularDocumentoGQL, { id }, servidor);
  }
}
