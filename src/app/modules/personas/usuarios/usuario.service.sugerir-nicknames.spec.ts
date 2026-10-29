import { ApolloError } from '@apollo/client/core';
import { Observable, of, throwError } from 'rxjs';
import { LECTURA_ESTRICTA } from '../../../generics/generic-crud.constantes';
import { UsuarioService } from './usuario.service';

describe('UsuarioService.onSugerirNicknames', () => {
  let respuestas: { [nickname: string]: () => Observable<any> };
  let service: UsuarioService;
  let errorConfs: any[];

  beforeEach(() => {
    errorConfs = [];
    respuestas = {};
    service = Object.create(UsuarioService.prototype);
    (service as any).genericService = {
      onGetByTexto: (_gql, texto: string, _servidor, _duracion, errorConf) => {
        errorConfs.push(errorConf);
        return (respuestas[texto] ?? (() => of(false)))();
      },
    };
  });

  const sugerir = (nombre: string, excluir: string[] = []): string[] => {
    let res: string[] = null;
    service.onSugerirNicknames(nombre, excluir).subscribe(r => (res = r));
    return res;
  };

  it('devuelve solo las libres, en orden, hasta 4, y consulta sin aviso del genérico', () => {
    respuestas['ROLANDO RIVAS'] = () => of(true);
    expect(sugerir('MAURO ROLANDO RIVAS FERNANDEZ', ['MAURO RIVAS'])).toEqual(['MAURO FERNANDEZ', 'ROLANDO FERNANDEZ']);
    expect(errorConfs.every(e => e === LECTURA_ESTRICTA)).toBeTrue();
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
    expect(errorConfs.length).toBe(0);
  });
});
