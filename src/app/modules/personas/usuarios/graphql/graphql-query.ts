import gql from "graphql-tag";

export const usuariosQuery = gql`
  {
    usuario {
      id
      email
      nickname
      persona {
        id
        nombre
      }
      creadoEn
    }
  }
`;

export const usuariosSearch = gql`
  query ($texto: String) {
    data: usuarioSearch(texto: $texto) {
      id
      email
      nickname
      persona {
        id
        nombre
      }
      creadoEn
    }
  }
`;

export const usuarioQuery = gql`
  query ($id: ID!) {
    data: usuario(id: $id) {
      id
      email
      nickname
      persona {
        id
        nombre
      }
    }
  }
`;

export const saveUsuario = gql`
  mutation saveUsuario($usuario: UsuarioInput!) {
    data: saveUsuario(usuario: $usuario) {
      id
    }
  }
`;

export const deleteUsuarioQuery = gql`
  mutation deleteUsuario($id: ID!) {
    deleteUsuario(id: $id)
  }
`;
