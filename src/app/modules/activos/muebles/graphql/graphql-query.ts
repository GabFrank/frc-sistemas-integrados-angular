import gql from 'graphql-tag';

export const muebleByIdQuery = gql`
  query mueble($id: ID!) {
    data: mueble(id: $id) {
      id
      identificador
      descripcion
      consumeEnergia
      consumoValor
      valorTasacion
      valorTasacionPyg
      valorTasacionBrl
      creadoEn
      propietario {
        id
        nombre
      }
      familia {
        id
        descripcion
      }
      tipoMueble {
        id
        descripcion
      }
      situacionPago
      proveedor {
        id
        nombre
      }
      moneda {
        id
        denominacion
        simbolo
      }
      montoTotal
      montoYaPagado
      cantidadCuotas
      cantidadCuotasPagadas
      diaVencimiento
      usuario {
        id
        nickname
      }
    }
  }
`;

export const muebleSearchQuery = gql`
  query muebleSearch($texto: String!) {
    data: muebleSearch(texto: $texto) {
      id
      identificador
      descripcion
    }
  }
`;

export const muebleSearchPageQuery = gql`
  query muebleSearchPage($texto: String, $page: Int!, $size: Int!) {
    data: muebleSearchPage(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        identificador
        descripcion
        consumeEnergia
        consumoValor
        valorTasacion
        valorTasacionPyg
        valorTasacionBrl
        propietario {
            id
            nombre
        }
        familia {
            id
            descripcion
        }
        tipoMueble {
            id
            descripcion
        }
        situacionPago
        proveedor {
            id
            nombre
        }
        moneda {
            id
            denominacion
            simbolo
        }
      }
    }
  }
`;

export const familiaMuebleSearchQuery = gql`
  query familiaMuebleSearch($texto: String!) {
    data: familiaMuebleSearch(texto: $texto) {
      id
      descripcion
    }
  }
`;

export const tipoMuebleSearchQuery = gql`
  query tipoMuebleSearch($texto: String!) {
    data: tipoMuebleSearch(texto: $texto) {
      id
      descripcion
    }
  }
`;

export const familiaMuebleSearchPageQuery = gql`
  query familiaMuebleSearchPage($texto: String, $page: Int!, $size: Int!) {
    data: familiaMuebleSearchPage(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        descripcion
      }
    }
  }
`;

export const tipoMuebleSearchPageQuery = gql`
  query tipoMuebleSearchPage($texto: String, $page: Int!, $size: Int!) {
    data: tipoMuebleSearchPage(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        descripcion
      }
    }
  }
`;

export const saveMuebleMutation = gql`
  mutation saveMueble($entity: MuebleInput!) {
    data: saveMueble(mueble: $entity) {
      id
      identificador
      descripcion
    }
  }
`;

export const deleteMuebleMutation = gql`
  mutation deleteMueble($id: ID!) {
    data: deleteMueble(id: $id)
  }
`;
