import gql from 'graphql-tag';

const FIELDS = `id tipo estado vencida email telefono observacion intentos ip venceEn resueltoEn motivoRechazo
  completadoEn creadoEn
  usuario { id nickname persona { id nombre documento telefono } }
  resueltoPor { id nickname }`;

export const solicitudesRecuperacionContrasenaQuery = gql`
  query ($estado: String, $page: Int, $size: Int) {
    data: solicitudesRecuperacionContrasena(estado: $estado, page: $page, size: $size) {
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

export const aprobarRecuperacionContrasenaMutation = gql`
  mutation ($id: ID!) {
    data: aprobarRecuperacionContrasena(id: $id) { ${FIELDS} }
  }
`;

export const rechazarRecuperacionContrasenaMutation = gql`
  mutation ($id: ID!, $motivo: String!) {
    data: rechazarRecuperacionContrasena(id: $id, motivo: $motivo) { ${FIELDS} }
  }
`;
