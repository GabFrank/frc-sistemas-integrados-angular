import gql from "graphql-tag";

export const usuariosQuery = gql`
  query ($page: Int) {
    data: usuarios(page: $page) {
      id
      nickname
      activo
      persona {
        id
        nombre
        telefono
        imagenes
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
        imagenes
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
        imagenes
      }
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      roles
      inicioSesion {
        id
        usuario {
          id
        }
        sucursal {
          id
        }
        tipoDespositivo
        idDispositivo
        token
        horaInicio
        horaFin
        creadoEn
      }
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
        imagenes
      }
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      roles
      inicioSesion {
        id
        usuario {
          id
        }
        sucursal {
          id
        }
        tipoDespositivo
        idDispositivo
        token
        horaInicio
        horaFin
        creadoEn
      }
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
        imagenes
      }
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      inicioSesion {
        id
        usuario {
          id
        }
        sucursal {
          id
        }
        tipoDespositivo
        idDispositivo
        token
        horaInicio
        horaFin
        creadoEn
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

export const inicioSesionListPorUsuarioIdAndAbiertoGQL = gql`
  query ($id: Int!, $sucId: Int, $page: Int, $size: Int) {
    data: inicioSesionListPorUsuarioIdAndAbierto(
      id: $id
      sucId: $sucId
      page: $page
      size: $size
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        usuario {
          id
        }
        sucursal {
          id
        }
        tipoDespositivo
        idDispositivo
        token
        horaInicio
        horaFin
        creadoEn
      }
    }
  }
`;

export const saveInicioSesionGQL = gql`
  mutation saveInicioSesion($entity: InicioSesionInput!) {
    data: saveInicioSesion(entity: $entity) {
      id
      usuario {
        id
      }
      sucursal {
        id
      }
      tipoDespositivo
      idDispositivo
      token
      horaInicio
      horaFin
      creadoEn
    }
  }
`;

// usuarioPorPersonaId

export const saveUsuarioImageQuery = gql`
  query ($id: ID!, $type: String!, $image: String!) {
    data: saveUsuarioImage(id: $id, type: $type, image: $image)
  }
`;

export const getUsuarioImagesQuery = gql`
  query ($id: ID!, $type: String!) {
    data: getUsuarioImages(id: $id, type: $type)
  }
`;

export const usuariosSearchPaginated = gql`
  query ($texto: String, $page: Int, $size: Int) {
    data: usuarioSearchPaginated(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        nickname
        activo
        persona {
          id
          nombre
          documento
          imagenes
        }
      }
    }
  }
`;
