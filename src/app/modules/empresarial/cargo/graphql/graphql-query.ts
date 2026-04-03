import gql from "graphql-tag";

export const cargosQuery = gql`
  {
    data: cargos {
      id
      nombre
      descripcion
      subcargoList {
        id
        nombre
      }
    }
  }
`;

export const cargosSearch = gql`
  query ($texto: String) {
    data: cargosSearch(texto: $texto) {
      id
      nombre
      descripcion
      subcargoList {
        id
        nombre
      }
    }
  }
`;

export const cargoQuery = gql`
  query ($id: ID!) {
    data: cargo(id: $id) {
      id
      nombre
      descripcion
      subcargoList {
        id
        nombre
      }
    }
  }
`;
