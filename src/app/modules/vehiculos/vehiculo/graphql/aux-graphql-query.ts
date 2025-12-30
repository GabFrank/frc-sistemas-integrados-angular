import gql from 'graphql-tag';

export const marcaSearchQuery = gql`
  query marcaSearch($texto: String) {
    data: marcaSearch(texto: $texto) {
      id
      descripcion
    }
  }
`;

export const modeloSearchQuery = gql`
  query modeloSearch($texto: String) {
    data: modeloSearch(texto: $texto) {
      id
      descripcion
      marca {
        id
        descripcion
      }
    }
  }
`;

export const tipoVehiculoSearchQuery = gql`
  query tipoVehiculoSearch($texto: String) {
    data: tipoVehiculoSearch(texto: $texto) {
      id
      descripcion
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
