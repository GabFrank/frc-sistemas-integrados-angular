import gql from 'graphql-tag';

const entradaVariaFields = `
  id
  descripcion
  monto
  esIngreso
  cajaVirtual {
    id
    nombre
  }
  moneda {
    id
    denominacion
    simbolo
  }
  categoria {
    id
    nombre
    icono
  }
  formaPago {
    id
    descripcion
  }
  numeroComprobante
  movimientoCajaVirtualId
  usuario {
    id
    persona {
      id
      nombre
    }
  }
  anulado
  creadoEn
`;

export const entradasVariasQuery = gql`
  query ($cajaVirtualId: ID!, $page: Int, $size: Int) {
    data: entradasVarias(cajaVirtualId: $cajaVirtualId, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ${entradaVariaFields}
      }
    }
  }
`;

export const entradaVariaCategoriasQuery = gql`
  query {
    data: entradaVariaCategorias {
      id
      nombre
      icono
      activo
      padre {
        id
        nombre
      }
    }
  }
`;

export const registrarEntradaVariaMutation = gql`
  mutation registrarEntradaVaria($input: EntradaVariaInput!) {
    data: registrarEntradaVaria(input: $input) {
      ${entradaVariaFields}
    }
  }
`;

export const anularEntradaVariaMutation = gql`
  mutation anularEntradaVaria($id: ID!, $motivo: String) {
    data: anularEntradaVaria(id: $id, motivo: $motivo) {
      ${entradaVariaFields}
    }
  }
`;
