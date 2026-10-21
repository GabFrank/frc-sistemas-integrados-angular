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
    data: cargos(page: 0, size: 1000) { ${CARGO_FIELDS} }
  }
`;

export const cargosSearch = gql`
  query ($texto: String) {
    data: cargosSearch(texto: $texto) { ${CARGO_FIELDS} }
  }
`;

export const cargosWithPageQuery = gql`
  query ($page: Int, $size: Int, $texto: String) {
    data: cargosWithPage(page: $page, size: $size, texto: $texto) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${CARGO_FIELDS} }
    }
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
