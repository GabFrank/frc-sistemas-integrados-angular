import gql from "graphql-tag";

export const terminalesPosQuery = gql`
  query ($page: Int, $size: Int) {
    data: terminalesPos(page: $page, size: $size) {
      id
      descripcion
      codigo
      activo
      creadoEn
      usuario {
        id
        nickname
        persona {
          nombre
        }
      }
    }
  }
`;

export const terminalPosQuery = gql`
  query ($id: ID!) {
    data: terminalPos(id: $id) {
      id
      descripcion
      codigo
      activo
      creadoEn
      usuario {
        id
        nickname
        persona {
          nombre
        }
      }
    }
  }
`;

export const searchTerminalPosQuery = gql`
  query ($texto: String) {
    data: searchTerminalPos(texto: $texto) {
      id
      descripcion
      codigo
      activo
      creadoEn
      usuario {
        id
        nickname
        persona {
          nombre
        }
      }
    }
  }
`;

export const filterTerminalPosQuery = gql`
  query ($descripcion: String, $codigo: String, $activo: Boolean, $page: Int, $size: Int) {
    data: filterTerminalPos(descripcion: $descripcion, codigo: $codigo, activo: $activo, page: $page, size: $size) {
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
        codigo
        activo
        creadoEn
        usuario {
          id
          nickname
          persona {
            nombre
          }
        }
      }
    }
  }
`;

export const saveTerminalPos = gql`
  mutation saveTerminalPos($entity: TerminalPosInput!) {
    data: saveTerminalPos(terminalPos: $entity) {
      id
      descripcion
      codigo
      activo
      creadoEn
      usuario {
        id
        nickname
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteTerminalPosQuery = gql`
  mutation deleteTerminalPos($id: ID!) {
    deleteTerminalPos(id: $id)
  }
`;

export const countTerminalPosQuery = gql`
  {
    data: countTerminalPos
  }
`;
