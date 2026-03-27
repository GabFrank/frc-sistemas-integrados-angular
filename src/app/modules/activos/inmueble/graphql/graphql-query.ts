import gql from 'graphql-tag';

export const inmuebleByIdQuery = gql`
  query inmueble($id: ID!) {
    data: inmueble(id: $id) {
      id
      nombreAsignado
      direccion
      googleMapsUrl
      codigoCatastral
      valorTasacion
      creadoEn
      propietario {
        id
        nombre
      }
      pais {
        id
        descripcion
      }
      ciudad {
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

export const inmuebleSearchQuery = gql`
  query inmuebleSearch($texto: String!) {
    data: inmuebleSearch(texto: $texto) {
      id
      nombreAsignado
      direccion
    }
  }
`;

export const inmuebleSearchPageQuery = gql`
  query inmuebleSearchPage($texto: String, $page: Int!, $size: Int!) {
    data: inmuebleSearchPage(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        nombreAsignado
        direccion
        codigoCatastral
        valorTasacion
        pais {
          id
          descripcion
        }
        ciudad {
          id
          descripcion
        }
        propietario {
          id
          nombre
        }
      }
    }
  }
`;

export const saveInmuebleMutation = gql`
  mutation saveInmueble($entity: InmuebleInput!) {
    data: saveInmueble(inmueble: $entity) {
      id
      nombreAsignado
    }
  }
`;

export const deleteInmuebleMutation = gql`
  mutation deleteInmueble($id: ID!) {
    data: deleteInmueble(id: $id)
  }
`;
