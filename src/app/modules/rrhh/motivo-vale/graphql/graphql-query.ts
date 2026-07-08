import gql from "graphql-tag";

const FIELDS = `id nombre descripcion activo creadoEn usuario { id nickname }`;

export const motivosValeQuery = gql`
  query ($page: Int, $size: Int) {
    data: motivosVale(page: $page, size: $size) { ${FIELDS} }
  }
`;

export const motivosValeActivosQuery = gql`
  { data: motivosValeActivos { ${FIELDS} } }
`;

export const saveMotivoValeMutation = gql`
  mutation saveMotivoVale($entity: MotivoValeInput!) {
    data: saveMotivoVale(motivoVale: $entity) { ${FIELDS} }
  }
`;

export const deleteMotivoValeMutation = gql`
  mutation deleteMotivoVale($id: ID!) { deleteMotivoVale(id: $id) }
`;
