import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import {
  desactivarFormatoTerminalPosMutation,
  formatosTerminalPosActivosCentralQuery,
  formatosTerminalPosActivosQuery,
  formatosTerminalPosQuery,
  saveFormatoTerminalPosMutation,
  terminalesQueUsanFormatoQuery,
} from './graphql-query';
import { FormatoTerminalPos } from '../formato-terminal-pos.model';

@Injectable({ providedIn: 'root' })
export class FormatosTerminalPosGQL extends Query<{ data: FormatoTerminalPos[] }> {
  document = formatosTerminalPosQuery;
}

@Injectable({ providedIn: 'root' })
export class FormatosTerminalPosActivosGQL extends Query<{ data: FormatoTerminalPos[] }> {
  document = formatosTerminalPosActivosQuery;
}

/** La misma operacion, con la seleccion que entiende el CENTRAL. Ver la query. */
@Injectable({ providedIn: 'root' })
export class FormatosTerminalPosActivosCentralGQL extends Query<{ data: FormatoTerminalPos[] }> {
  document = formatosTerminalPosActivosCentralQuery;
}

@Injectable({ providedIn: 'root' })
export class SaveFormatoTerminalPosGQL extends Mutation<{ data: FormatoTerminalPos }> {
  document = saveFormatoTerminalPosMutation;
}

@Injectable({ providedIn: 'root' })
export class DesactivarFormatoTerminalPosGQL extends Mutation<{ data: boolean }> {
  document = desactivarFormatoTerminalPosMutation;
}

@Injectable({ providedIn: 'root' })
export class TerminalesQueUsanFormatoGQL extends Query<{ data: number }> {
  document = terminalesQueUsanFormatoQuery;
}
