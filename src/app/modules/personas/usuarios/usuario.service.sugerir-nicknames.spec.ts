import { ApolloError } from '@apollo/client/core';
import { Observable, of, throwError } from 'rxjs';
import { LECTURA_ESTRICTA } from '../../../generics/generic-crud.constantes';
import { UsuarioService } from './usuario.service';

describe('UsuarioService.onSugerirNicknames', () => {
  let respuestas: { [nickname: string]: () => Observable<any> };
  let service: UsuarioService;
  let llamadas: { errorConf: any; silentLoad: boolean; contexto: any }[];

  beforeEach(() => {
    llamadas = [];
    respuestas = {};
    service = Object.create(UsuarioService.prototype);
    (service as any).genericService = {
      onCustomQuery: (_gql, data: { texto: string }, _servidor, errorConf, silentLoad, contexto) => {
        llamadas.push({ errorConf, silentLoad, contexto });
        return (respuestas[data.texto] ?? (() => of(false)))();
      },
    };
  });

  const sugerir = (nombre: string, excluir: string[] = []): string[] => {
    let res: string[] = null;
    service.onSugerirNicknames(nombre, excluir).subscribe(r => (res = r));
    return res;
  };

  it('devuelve solo las libres, en orden, hasta 4, sin «Buscando…» ni avisos del genérico', () => {
    respuestas['ROLANDO RIVAS'] = () => of(true);
    expect(sugerir('MAURO ROLANDO RIVAS FERNANDEZ', ['MAURO RIVAS'])).toEqual(['MAURO FERNANDEZ', 'ROLANDO FERNANDEZ']);
    expect(llamadas.length).toBe(3);
    llamadas.forEach(l => {
      expect(l.errorConf).toBe(LECTURA_ESTRICTA);
      expect(l.silentLoad).toBeTrue();
      expect(l.contexto).toEqual(jasmine.objectContaining({ timeoutMs: 15000, sinAviso: true, silenciarAvisoTimeout: true }));
    });
  });

  it('corta en 4', () => {
    expect(sugerir('WILDO GABRIEL RUIZ DIAZ SOSA').length).toBe(4);
  });

  it('lo que falla (red o servidor) o no responde no se sugiere; el resto sí', () => {
    respuestas['MAURO RIVAS'] = () => throwError(() => new ApolloError({ networkError: new Error('Failed to fetch') }));
    respuestas['MAURO FERNANDEZ'] = () => throwError(() => ({ message: 'rechazado', errors: [] }));
    respuestas['ROLANDO RIVAS'] = () => new Observable(o => o.complete());
    expect(sugerir('MAURO ROLANDO RIVAS FERNANDEZ')).toEqual(['ROLANDO FERNANDEZ']);
  });

  it('sin candidatos no consulta', () => {
    expect(sugerir('MAURO')).toEqual([]);
    expect(llamadas.length).toBe(0);
  });
});
