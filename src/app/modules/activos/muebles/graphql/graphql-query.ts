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
        familia {
            id
            descripcion
        }
        tipoMueble {
            id
            descripcion
        }
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
