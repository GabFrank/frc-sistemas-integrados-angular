import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../components/search-list-dialog/search-list-dialog.component';
import { PersonaSearchPageGQL } from '../../modules/personas/persona/graphql/personaSearchPage';
import { MonedasSearchGQL } from '../../modules/financiero/moneda/graphql/monedasSearch';
import { PaisSearchGQL } from '../../modules/general/pais/graphql/paisSearch';
import { CiudadesSearchGQL } from '../../modules/general/ciudad/graphql/ciudadesSearchGQL';
import { AdicionarPersonaDialogComponent } from '../../modules/personas/persona/adicionar-persona-dialog/adicionar-persona-dialog.component';
import { VehiculoSearchPageGQL } from '../../modules/activos/vehiculos/vehiculo/graphql/vehiculoSearchPage';
import { Persona } from '../../modules/personas/persona/persona.model';
import { Pais } from '../../modules/general/pais/pais.model';
import { Ciudad } from '../../modules/general/ciudad/ciudad.model';
import { Vehiculo } from '../../modules/activos/vehiculos/vehiculo/models/vehiculo.model';

@Injectable({
  providedIn: 'root'
})
export class AssetCommonDialogService {
  private dialog = inject(MatDialog);
  private personaSearchPageGQL = inject(PersonaSearchPageGQL);
  private monedasSearchGQL = inject(MonedasSearchGQL);
  private paisSearchGQL = inject(PaisSearchGQL);
  private ciudadesSearchGQL = inject(CiudadesSearchGQL);
  private vehiculoSearchPageGQL = inject(VehiculoSearchPageGQL);

  buscarPersona(callback: (persona: Persona) => void): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'nombre', nombre: 'Nombre' },
      { id: 'documento', nombre: 'Documento' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Persona',
      query: this.personaSearchPageGQL,
      tableData: tableData,
      inicialSearch: true,
      isAdicionar: true,
      paginator: true,
      isServidor: true
    };

    this.dialog.open(SearchListDialogComponent, {
      width: '60%',
      height: '80%',
      data: data
    }).afterClosed().subscribe((res: any) => {
      if (res) {
        if (res.adicionar) {
          this.adicionarPersona().subscribe(nuevaPersona => {
            if (nuevaPersona) {
              callback(nuevaPersona);
            }
          });
        } else {
          callback(res);
        }
      }
    });
  }

  adicionarPersona(): Observable<Persona | undefined> {
    return this.dialog.open(AdicionarPersonaDialogComponent, {
      width: '700px'
    }).afterClosed();
  }

  buscarMoneda(callback: (moneda: any) => void): void {
    const tableData: TableData[] = [
      { id: 'denominacion', nombre: 'Denominación' },
      { id: 'simbolo', nombre: 'Símbolo' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Moneda',
      query: this.monedasSearchGQL,
      tableData: tableData,
      inicialSearch: true
    };

    this.dialog.open(SearchListDialogComponent, {
      width: '400px',
      data: data
    }).afterClosed().subscribe(res => {
      if (res) {
        callback(res);
      }
    });
  }

  buscarPais(callback: (pais: Pais) => void): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'descripcion', nombre: 'Descripción' },
      { id: 'codigo', nombre: 'Código' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar País',
      query: this.paisSearchGQL,
      tableData: tableData,
      inicialSearch: true
    };

    this.dialog.open(SearchListDialogComponent, {
      width: '600px',
      data: data
    }).afterClosed().subscribe(res => {
      if (res) {
        callback(res);
      }
    });
  }

  buscarCiudad(callback: (ciudad: Ciudad) => void): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'descripcion', nombre: 'Descripción' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Ciudad',
      query: this.ciudadesSearchGQL,
      tableData: tableData,
      inicialSearch: true
    };

    this.dialog.open(SearchListDialogComponent, {
      width: '600px',
      data: data
    }).afterClosed().subscribe(res => {
      if (res) {
        callback(res);
      }
    });
  }

  buscarVehiculo(callback: (vehiculo: Vehiculo) => void): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'Id' },
      { id: 'chapa', nombre: 'Chapa' },
      { id: 'modelo.marca.descripcion', nombre: 'Marca' },
      { id: 'modelo.descripcion', nombre: 'Modelo' }
    ];

    const searchData: SearchListtDialogData = {
      query: this.vehiculoSearchPageGQL,
      tableData,
      titulo: 'Buscar Vehículo',
      search: true,
      inicialSearch: true,
      textHint: 'Buscar por chapa, marca o modelo...',
      paginator: true,
      queryData: { page: 0, size: 15 }
    };

    this.dialog.open(SearchListDialogComponent, {
      data: searchData,
      width: '70%',
      height: '80%'
    }).afterClosed().subscribe((res: Vehiculo) => {
      if (res) {
        callback(res);
      }
    });
  }
}
