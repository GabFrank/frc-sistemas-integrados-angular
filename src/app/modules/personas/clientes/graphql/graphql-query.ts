import gql from "graphql-tag";

export const clientesQuery = gql`
  {
    clientes {
      id
      persona {
        id
        nombre
      }
      nombre
      credito
      contactos {
        id
        telefono
      }
    }
  }
`;

export const clientesSearchByPersona = gql`
  query ($texto: String) {
    data: clientePorPersona(texto: $texto) {
      id
      persona {
        id
        nombre
        direccion
      }
      tipo
      nombre
      credito
      creadoEn
      usuario {
        id
      }
      saldo
      codigo
      sucursal {
        id
      }
      tributa
      verificadoSet
      contactos {
        id
        telefono
      }
    }
  }
`;

export const clientePorPersonaDocumento = gql`
  query ($texto: String) {
    data: clientePorPersonaDocumento(texto: $texto) {
      id
      persona {
        id
        nombre
        direccion
      }
      tipo
      nombre
      documento
      credito
      creadoEn
      usuario {
        id
      }
      saldo
      codigo
      sucursal {
        id
      }
      tributa
      verificadoSet
      contactos {
        id
        telefono
      }
    }
  }
`;

export const clienteConFiltros = gql`
  query ($texto: String, $tipo: TipoCliente, $page: Int, $size: Int) {
    data: onSearchWithFilters(
      texto: $texto
      tipo: $tipo
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
        persona {
          id
          nombre
          apodo
          telefono
          email
          direccion
          documento
          nacimiento
        }
        nombre
        credito
        saldo
        codigo
        tipo
        contactos {
          id
          telefono
        }
        creadoEn
        usuario {
          id
          nickname
        }
        tributa
        verificadoSet
        sucursal {
          id
        }
      }
    }
  }
`;

export const clienteSearchByPersonaId = gql`
  query ($id: ID) {
    data: clientePorPersonaId(id: $id) {
      id
      persona {
        id
        nombre
      }
      nombre
      credito
      contactos {
        id
        telefono
      }
      saldo
      tipo
      codigo
    }
  }
`;

export const clientePorPersonaIdFromServer = gql`
  query ($id: ID) {
    data: clientePorPersonaIdFromServer(id: $id) {
      id
      persona {
        id
        nombre
      }
      nombre
      credito
      contactos {
        id
        telefono
      }
      saldo
      tipo
      codigo
    }
  }
`;

export const clientesSearchByTelefono = gql`
  query ($texto: String) {
    data: clientePorTelefono(texto: $texto) {
      id
      persona {
        id
        nombre
      }
      nombre
      credito
      contactos {
        id
        telefono
      }
    }
  }
`;

export const clienteQuery = gql`
  query ($id: ID!) {
    data: cliente(id: $id) {
      id
      persona {
        id
        nombre
        apodo
        telefono
        email
        direccion
        documento
        nacimiento
      }
      nombre
      credito
      tipo
      contactos {
        id
        telefono
      }
    }
  }
`;

export const saveCliente = gql`
  mutation saveCliente($entity: ClienteInput!) {
    data: saveCliente(cliente: $entity) {
      id
      persona {
        id
        nombre
        apodo
        telefono
        email
        direccion
        documento
        nacimiento
      }
      nombre
      credito
      saldo
      tipo
      contactos {
        id
        telefono
      }
      creadoEn
      
    }
  }
`;

export const deleteClienteQuery = gql`
  mutation deleteCliente($id: ID!) {
    deleteCliente(id: $id)
  }
`;

export const consultaRuc = gql`
  query ($ruc: String) {
    data: consultaRuc(ruc: $ruc) {
      procesamientoCorrecto
      mensajeProcesamiento
      ruc
      dv
      estado
      nombre
      direccion
    }
  }
`;
