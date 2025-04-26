import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, throwError } from "rxjs";

export interface RucResponse {
  procesamientoCorrecto: boolean;
  mensajeProcesamiento: string | null;
  ruc: string | null;
  dv: string | null;
  estado: string | null;
  nombre: string | null;
  nombreFantasia: string | null;
  telefono: string | null;
  direccion: string | null;
  codigoEstablecimiento: number | null;
  validacionCorrecta: boolean;
  mensajeValidacion: string | null;
}

@Injectable({
  providedIn: "root",
})
export class RucService {
  private apiUrl = 'https://cors-anywhere.herokuapp.com/https://siyopude.com/ruc/?ruc=';  // CORS proxy URL

  constructor(private http: HttpClient) {}

  getRucDetails(ruc: string): Observable<RucResponse> {
    return this.http.get(this.apiUrl + ruc, { responseType: 'text' }) // Handle as plain text
      .pipe(
        map(response => {
          // Extract JSON part by removing any HTML or warnings
          const jsonStartIndex = response.indexOf('{');
          const jsonString = response.substring(jsonStartIndex);
          return JSON.parse(jsonString) as RucResponse;
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError('An error occurred while fetching the RUC details.');
  }
}
