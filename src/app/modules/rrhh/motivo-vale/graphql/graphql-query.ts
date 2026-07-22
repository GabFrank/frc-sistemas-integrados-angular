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

export const motivosValePageQuery = gql`
  query ($page: Int, $size: Int, $descripcion: String, $activo: Boolean) {
    data: motivosValePage(page: $page, size: $size, descripcion: $descripcion, activo: $activo) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent { ${FIELDS} }
    }
  }
`;

export const saveMotivoValeMutation = gql`
  mutation saveMotivoVale($entity: MotivoValeInput!) {
    data: saveMotivoVale(motivoVale: $entity) { ${FIELDS} }
  }
`;

export const deleteMotivoValeMutation = gql`
  mutation deleteMotivoVale($id: ID!) { deleteMotivoVale(id: $id) }
`;
