import gql from "graphql-tag";

export const usuariosQuery = gql`
query ($page: Int){
  data: usuarios(page: $page) {
      id
      nickname
      activo
      persona {
        id
        nombre
        telefono
      }
      creadoEn
    }
  }
`;

export const usuariosSearch = gql`
  query ($texto: String) {
    data: usuarioSearch(texto: $texto) {
      id
      nickname
      activo
      persona {
        id
        nombre
      }
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
      activo
      persona {
        id
        nombre
      }
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
      activo
      persona {
        id
        nombre
      }
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
      activo
      persona {
        id
        nombre
      }
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

export const verificarUsuario = gql`
  query ($texto: String) {
    data: verificarUsuario(texto: $texto)
  }
`;

// usuarioPorPersonaId
