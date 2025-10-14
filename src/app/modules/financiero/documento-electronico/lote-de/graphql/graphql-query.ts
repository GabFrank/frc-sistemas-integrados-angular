import gql from "graphql-tag";

export const loteDeQuery = gql`
  query ($id: ID!) {
    data: loteDe(id: $id) {
      id
      estado
      fechaProcesado
      fechaUltimoIntento
      intentos
      respuestaSifen
      protocolo
      creadoEn
      actualizadoEn
      usuario {
        id
        nickname 
      }
    }
  }
`;

export const loteDesQuery = gql`
  query ($page: Int = 0, $size: Int = 10, $estado: EstadoLoteDE, $fechaInicio: String, $fechaFin: String) {
    data: loteDes(page: $page, size: $size, estado: $estado, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        estado
        fechaProcesado
        fechaUltimoIntento
        intentos
        respuestaSifen
        protocolo
        creadoEn
        actualizadoEn
        usuario {
          id
          nickname
        }
      }
    }
  }
`;

export const loteDesPaginadoQuery = gql`
  query ($page: Int = 0, $size: Int = 10) {
    data: loteDesPaginado(page: $page, size: $size) {
      id
      estado
      fechaProcesado
      fechaUltimoIntento
      intentos
      respuestaSifen
      protocolo
      creadoEn
      actualizadoEn
      usuario {
        id
        nickname
      }
    }
  }
`;

export const saveLoteDeMutation = gql`
  mutation ($input: LoteDEInput!) {
    data: saveLoteDe(input: $input) {
      id
    }
  }
`;