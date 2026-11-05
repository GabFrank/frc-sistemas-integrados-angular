import { candidatosNickname, normalizarNickname } from './nicknameUtils';

describe('nicknameUtils', () => {
  it('4 palabras: cada nombre con cada apellido, sin el ya tomado', () => {
    expect(candidatosNickname('Mauro Rolando Rivas Fernandez', ['mauro rivas']))
      .toEqual(['MAURO FERNANDEZ', 'ROLANDO RIVAS', 'ROLANDO FERNANDEZ']);
  });

  it('3 palabras: primero con el apellido, después con la del medio', () => {
    expect(candidatosNickname('CLAUDIO RAFAEL ROMERO'))
      .toEqual(['CLAUDIO ROMERO', 'RAFAEL ROMERO', 'CLAUDIO RAFAEL']);
  });

  it('2 palabras: una sola combinación; tomada, ninguna', () => {
    expect(candidatosNickname('RONALDO COLLANTE')).toEqual(['RONALDO COLLANTE']);
    expect(candidatosNickname('RONALDO COLLANTE', ['RONALDO COLLANTE'])).toEqual([]);
  });

  it('1 palabra, vacío o null: ninguna', () => {
    expect(candidatosNickname('MAURO')).toEqual([]);
    expect(candidatosNickname('   ')).toEqual([]);
    expect(candidatosNickname(null)).toEqual([]);
  });

  it('5 y 6 palabras: corta en 6', () => {
    expect(candidatosNickname('WILDO GABRIEL RUIZ DIAZ SOSA')).toEqual([
      'WILDO DIAZ', 'WILDO SOSA', 'GABRIEL DIAZ', 'GABRIEL SOSA', 'RUIZ DIAZ', 'RUIZ SOSA',
    ]);
    expect(candidatosNickname('A B C D E F').length).toBe(6);
  });

  it('saca partículas y espacios de más', () => {
    expect(candidatosNickname('  CARLOS  DE JESUS VERON   MARIN ')[0]).toBe('CARLOS VERON');
  });

  it('tildes afuera, Ñ adentro', () => {
    expect(normalizarNickname('Néstor Núñez')).toBe('NESTOR NUÑEZ');
    expect(candidatosNickname('NÉSTOR IVÁN AYALA ÑANDÚ', ['nestor ayala']))
      .toEqual(['NESTOR ÑANDU', 'IVAN AYALA', 'IVAN ÑANDU']);
  });
});
