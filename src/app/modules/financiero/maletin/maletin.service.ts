import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { AllMaletinsGQL } from './graphql/allMaletines';
import { CountMaletinGQL } from './graphql/count-maletin';
import { DeleteMaletinGQL } from './graphql/deleteMaletin';
import { MaletinByIdGQL } from './graphql/MaletinById';
import { MaletinPorDescripcionGQL } from './graphql/maletinPorDescripcion';
import { SaveMaletinGQL } from './graphql/saveMaletin';
import { ValorMaletinGQL } from './graphql/valorMaletin';
import { IngresarMaletinCajaMayorGQL } from './graphql/ingresarMaletinCajaMayor';
import { IngresarMaletinCierreGQL } from './graphql/ingresarMaletinCierre';
import { EgresarMaletinCajaMayorGQL } from './graphql/egresarMaletinCajaMayor';
import { MaletinInput } from './maletin.model';

@Injectable({
  providedIn: 'root'
})
export class MaletinService {

  constructor(
    private getAllMaletines: AllMaletinsGQL,
    private getMaletinPorId: MaletinByIdGQL,
    private genericCrud: GenericCrudService,
    private saveMaletin: SaveMaletinGQL,
    private deleteMaletin: DeleteMaletinGQL,
    private getMaletinPorDescripcion: MaletinPorDescripcionGQL,
    private countMaletin: CountMaletinGQL,
    private valorMaletinGQL: ValorMaletinGQL,
    private ingresarMaletinGQL: IngresarMaletinCajaMayorGQL,
    private ingresarMaletinCierreGQL: IngresarMaletinCierreGQL,
    private egresarMaletinGQL: EgresarMaletinCajaMayorGQL,
  ) { }

  /** Ingresa de una vez el valor del cierre del maletín para las monedas seleccionadas. */
  onIngresarCierre(cajaVirtualId: number, maletinId: number, monedaIds: number[], descripcion?: string, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onSaveCustom(this.ingresarMaletinCierreGQL, { cajaVirtualId, maletinId, monedaIds, descripcion: descripcion || null }, servidor);
  }

  /** Valor físico estimado dentro del maletín (por moneda, del último cierre). */
  onGetValor(maletinId: number, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onCustomQuery(this.valorMaletinGQL, { maletinId }, servidor);
  }

  /** Ingresa a la caja mayor el valor de un maletín. */
  onIngresar(cajaVirtualId: number, maletinId: number, monedaId: number, monto: number, descripcion?: string, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onSaveCustom(this.ingresarMaletinGQL, { cajaVirtualId, maletinId, monedaId, monto, descripcion: descripcion || null }, servidor);
  }

  /** Egresa de la caja mayor el valor que se despacha en un maletín. */
  onEgresar(cajaVirtualId: number, maletinId: number, monedaId: number, monto: number, descripcion?: string, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onSaveCustom(this.egresarMaletinGQL, { cajaVirtualId, maletinId, monedaId, monto, descripcion: descripcion || null }, servidor);
  }

  onCount(servidor: boolean = true): Observable<number> {
    return this.genericCrud.onCustomQuery(this.countMaletin, null, servidor);
  }

  onGetAll(page?, size?, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onGetAll(this.getAllMaletines, page, size, servidor)
  }

  onGetPorId(id, sucursalId, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onCustomQuery(this.getMaletinPorId, {id, sucursalId}, servidor)
  }

  onGetPorDescripcion(texto, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onGetByTexto(this.getMaletinPorDescripcion, texto, servidor)
  }

  onSave(input: MaletinInput, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onSave(this.saveMaletin, input, null, null, servidor)
  }

  onDelete(id, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onDelete(this.deleteMaletin, id, '¿Eliminar maletin?', null, true, servidor, "¿Está seguro que desea eliminar este maletin?");
  }

}
