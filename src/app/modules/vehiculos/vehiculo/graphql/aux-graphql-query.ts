import gql from 'graphql-tag';

export const marcaSearchQuery = gql`
  query marcaSearch($texto: String) {
    data: marcaSearch(texto: $texto) {
      id
      descripcion
    }
  }
`;

export const modeloSearchPageQuery = gql`
  query modeloSearchPage($texto: String, $page: Int, $size: Int) {
    data: modeloSearchPage(texto: $texto, page: $page, size: $size) {
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
        marca {
          id
          descripcion
        }
      }
    }
  }
`;

export const tipoVehiculoSearchPageQuery = gql`
  query tipoVehiculoSearchPage($texto: String, $page: Int, $size: Int) {
    data: tipoVehiculoSearchPage(texto: $texto, page: $page, size: $size) {
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

export const saveMarcaMutation = gql`
  mutation saveMarca($entity: MarcaInput!) {
    data: saveMarca(marca: $entity) {
      id
      descripcion
    }
  }
`;

export const saveModeloMutation = gql`
  mutation saveModelo($entity: ModeloInput!) {
    data: saveModelo(modelo: $entity) {
      id
      descripcion
      marca {
        id
        descripcion
      }
    }
  }
`;

export const saveTipoVehiculoMutation = gql`
  mutation saveTipoVehiculo($entity: TipoVehiculoInput!) {
    data: saveTipoVehiculo(tipoVehiculo: $entity) {
      id
      descripcion
    }
  }
`;

export const deleteModeloMutation = gql`
  mutation deleteModelo($id: ID!) {
    data: deleteModelo(id: $id)
  }
`;
