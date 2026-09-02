import gql from "graphql-tag";

const CARGO_FIELDS = `
  id
  nombre
  descripcion
  sueldoBase
  supervisadoPor { id nombre }
  subcargoList { id nombre }
`;

export const cargosQuery = gql`
  {
    data: cargos { ${CARGO_FIELDS} }
  }
`;

export const cargosSearch = gql`
  query ($texto: String) {
    data: cargosSearch(texto: $texto) { ${CARGO_FIELDS} }
  }
`;

export const cargoQuery = gql`
  query ($id: ID!) {
    data: cargo(id: $id) { ${CARGO_FIELDS} }
  }
`;

export const saveCargoQuery = gql`
  mutation saveCargo($entity: CargoInput!) {
    data: saveCargo(cargo: $entity) { ${CARGO_FIELDS} }
  }
`;

export const deleteCargoQuery = gql`
  mutation deleteCargo($id: ID!) {
    data: deleteCargo(id: $id)
  }
`;
