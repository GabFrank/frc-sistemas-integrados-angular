import { mensajeDeError } from './mensaje-error';

describe('mensajeDeError', () => {

  // La forma que realmente llega desde GenericCrudService.onCustomMutation: `obs.error(res.errors)`
  // propaga el ARRAY de GraphQLError. Leer `.message` sobre el array da undefined, y por eso el
  // mensaje del backend se perdía y el usuario veía un texto genérico.
  it('saca el mensaje del array de errores de GraphQL', () => {
    const err = [{ message: 'Ese cupon ya fue registrado en la venta con tarjeta 18.' }];

    expect(mensajeDeError(err, 'fallback')).toBe('Ese cupon ya fue registrado en la venta con tarjeta 18.');
  });

  it('saca el mensaje de un ApolloError', () => {
    const err = { graphQLErrors: [{ message: 'El cobro 10 ya esta vinculado a otro cupon.' }] };

    expect(mensajeDeError(err, 'fallback')).toBe('El cobro 10 ya esta vinculado a otro cupon.');
  });

  it('saca el mensaje de un Error común', () => {
    expect(mensajeDeError(new Error('se cayó la red'), 'fallback')).toBe('se cayó la red');
  });

  it('usa el fallback si el error no trae nada legible', () => {
    expect(mensajeDeError(null, 'fallback')).toBe('fallback');
    expect(mensajeDeError(undefined, 'fallback')).toBe('fallback');
    expect(mensajeDeError({}, 'fallback')).toBe('fallback');
    expect(mensajeDeError([], 'fallback')).toBe('fallback');
  });

  it('saltea las entradas vacías del array y toma la primera con mensaje', () => {
    const err = [{}, { message: 'el bueno' }];

    expect(mensajeDeError(err, 'fallback')).toBe('el bueno');
  });

  it('con graphQLErrors vacío cae al message del propio error', () => {
    const err = { graphQLErrors: [], message: 'Network error' };

    expect(mensajeDeError(err, 'fallback')).toBe('Network error');
  });
});
