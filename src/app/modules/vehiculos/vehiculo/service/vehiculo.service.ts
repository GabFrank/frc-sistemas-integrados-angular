import { Injectable, inject } from '@angular/core';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { VehiculoByIdGQL } from '../graphql/vehiculoById';
import { SaveVehiculoGQL } from '../graphql/saveVehiculo';
import { DeleteVehiculoGQL } from '../graphql/deleteVehiculo';
import { VehiculoSearchGQL } from '../graphql/vehiculoSearch';
import { Observable } from 'rxjs';
import { Vehiculo } from '../models/vehiculo.model';
import { VehiculoInput } from '../models/vehiculo-input.model';
import { ModeloSearchGQL } from '../graphql/modeloSearch';
import { TipoVehiculoSearchGQL } from '../graphql/tipoVehiculoSearch';
import { MarcaSearchGQL } from '../graphql/marcaSearch';
import { SaveMarcaGQL } from '../graphql/saveMarca';
import { SaveModeloGQL } from '../graphql/saveModelo';
import { Modelo } from '../models/modelo.model';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { Marca } from '../models/marca.model';
import { MarcaInput } from '../models/marca-input.model';
import { ModeloInput } from '../models/modelo-input.model';
import { TipoVehiculoInput } from '../models/tipo-vehiculo-input.model';
import { SaveTipoVehiculoGQL } from '../graphql/saveTipoVehiculo';
import { DeleteModeloGQL } from '../graphql/deleteModelo';
import { VehiculosSucursalByVehiculoGQL } from '../graphql/vehiculosSucursalByVehiculo';
import { VehiculosSucursalBySucursalGQL } from '../graphql/vehiculosSucursalBySucursal';
import { VehiculosSucursalGQL } from '../graphql/vehiculosSucursal';
import { SaveVehiculoSucursalGQL } from '../graphql/saveVehiculoSucursal';
import { DeleteVehiculoSucursalGQL } from '../graphql/deleteVehiculoSucursal';
import { VehiculoSucursal } from '../models/vehiculo-sucursal.model';
import { VehiculoSucursalInput } from '../models/vehiculo-sucursal-input.model';
import { VehiculosSucursalSearchPageGQL } from '../graphql/vehiculosSucursalSearchPage';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private genericService = inject(GenericCrudService);
  private vehiculoByIdGQL = inject(VehiculoByIdGQL);
  private saveVehiculoGQL = inject(SaveVehiculoGQL);
  private deleteVehiculoGQL = inject(DeleteVehiculoGQL);
  private vehiculoSearchGQL = inject(VehiculoSearchGQL);
  private modeloSearchGQL = inject(ModeloSearchGQL);
  private tipoVehiculoSearchGQL = inject(TipoVehiculoSearchGQL);
  private marcaSearchGQL = inject(MarcaSearchGQL);
  private saveMarcaGQL = inject(SaveMarcaGQL);
  private saveModeloGQL = inject(SaveModeloGQL);
  private deleteModeloGQL = inject(DeleteModeloGQL);
  private saveTipoVehiculoGQL = inject(SaveTipoVehiculoGQL);
  private vehiculosSucursalByVehiculoGQL = inject(VehiculosSucursalByVehiculoGQL);
  private vehiculosSucursalBySucursalGQL = inject(VehiculosSucursalBySucursalGQL);
  private vehiculosSucursalGQL = inject(VehiculosSucursalGQL);
  private saveVehiculoSucursalGQL = inject(SaveVehiculoSucursalGQL);
  private deleteVehiculoSucursalGQL = inject(DeleteVehiculoSucursalGQL);
  private vehiculosSucursalSearchPageGQL = inject(VehiculosSucursalSearchPageGQL);

  onBuscarPorId(id: number): Observable<Vehiculo> {
    return this.genericService.onGetById(this.vehiculoByIdGQL, id);
  }

  onFiltrar(texto: string, page: number, size: number): Observable<Vehiculo[]> {
    return this.genericService.onCustomQuery(this.vehiculoSearchGQL, { texto, page, size });
  }

  onGuardar(input: VehiculoInput): Observable<Vehiculo> {
    return this.genericService.onSave(this.saveVehiculoGQL, input);
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteVehiculoGQL,
      id,
      '¿Eliminar vehículo?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar este vehículo?'
    );
  }

  onFiltrarModelos(texto: string): Observable<Modelo[]> {
    return this.genericService.onGetByTexto(this.modeloSearchGQL, texto);
  }

  onFiltrarTipos(texto: string): Observable<TipoVehiculo[]> {
    return this.genericService.onGetByTexto(this.tipoVehiculoSearchGQL, texto);
  }

  onFiltrarMarcas(texto: string): Observable<Marca[]> {
    return this.genericService.onGetByTexto(this.marcaSearchGQL, texto);
  }

  onGuardarMarca(input: MarcaInput): Observable<Marca> {
    return this.genericService.onSave(this.saveMarcaGQL, input);
  }

  onGuardarModelo(input: ModeloInput): Observable<Modelo> {
    return this.genericService.onSave(this.saveModeloGQL, input);
  }

  onEliminarModelo(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteModeloGQL,
      id,
      '¿Eliminar modelo?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar este modelo?'
    );
  }

  onGuardarTipo(input: TipoVehiculoInput): Observable<TipoVehiculo> {
    return this.genericService.onSave(this.saveTipoVehiculoGQL, input);
  }

  onBuscarVehiculosSucursalPorVehiculo(vehiculoId: number): Observable<VehiculoSucursal[]> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalByVehiculoGQL, { vehiculoId });
  }

  onGuardarVehiculoSucursal(input: VehiculoSucursalInput): Observable<VehiculoSucursal> {
    return this.genericService.onSave(this.saveVehiculoSucursalGQL, input);
  }

  onEliminarVehiculoSucursal(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteVehiculoSucursalGQL,
      id,
      '¿Eliminar asignación de vehículo a sucursal?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar esta asignación?'
    );
  }

  onBuscarTodosVehiculosSucursal(page: number = 0, size: number = 1000): Observable<VehiculoSucursal[]> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalGQL, { page, size });
  }

  onBuscarVehiculosSucursalPorSucursal(sucursalId: number): Observable<VehiculoSucursal[]> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalBySucursalGQL, { sucursalId });
  }

  onBuscarVehiculosSucursalSearchPage(sucursalId: number | null, responsableId: number | null, page: number, size: number): Observable<any> {
    return this.genericService.onCustomQuery(this.vehiculosSucursalSearchPageGQL, { sucursalId, responsableId, page, size });
  }
}

