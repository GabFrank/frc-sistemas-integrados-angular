import gql from "graphql-tag";

export const usuariosQuery = gql`
  {
    usuario {
      id
      nickname
      persona {
        id
        nombre
      }
      password
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const usuariosSearch = gql`
  query ($texto: String) {
    data: usuarioSearch(texto: $texto) {
      id
      nickname
      persona {
        id
        nombre
      }
      password
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const usuarioQuery = gql`
  query ($id: ID!) {
    data: usuario(id: $id) {
      id
      nickname
      persona {
        id
        nombre
      }
      password
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      roles
    }
  }
`;

export const usuarioPorPersonaIdQuery = gql`
  query ($id: ID!) {
    data: usuarioPorPersonaId(id: $id) {
      id
      nickname
      persona {
        id
        nombre
      }
      password
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      roles
    }
  }
`;

export const saveUsuario = gql`
  mutation saveUsuario($entity: UsuarioInput!) {
    data: saveUsuario(usuario: $entity) {
      id
      nickname
      persona {
        id
        nombre
      }
      password
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteUsuarioQuery = gql`
  mutation deleteUsuario($id: ID!) {
    deleteUsuario(id: $id)
  }
`;

// usuarioPorPersonaId
