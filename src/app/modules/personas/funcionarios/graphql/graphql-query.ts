import gql from "graphql-tag";

export const funcionariosQuery = gql`
  query ($page: Int){
    data: funcionarios(page: $page) {
      id
      credito
      diarista
      sueldo
      fechaIngreso
      creadoEn
      fasePrueba
      activo
      nickname
      persona {
        id
        nombre
        telefono
      }
      cargo {
        id
        nombre
      }
      supervisadoPor {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const funcionariosSearch = gql`
  query ($texto: String) {
    data: funcionariosSearch(texto: $texto) {
      id
      credito
      diarista
      sueldo
      fechaIngreso
      creadoEn
      fasePrueba
      activo
      nickname
      persona {
        id
        nombre
        telefono
      }
      cargo {
        id
        nombre
      }
      supervisadoPor {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const funcionarioQuery = gql`
  query ($id: ID!) {
    data: funcionario(id: $id) {
      id
      credito
      diarista
      sueldo
      fechaIngreso
      creadoEn
      fasePrueba
      activo
      nickname
      persona {
        id
        nombre
        telefono
      }
      cargo {
        id
        nombre
      }
      supervisadoPor {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const saveFuncionario = gql`
  mutation saveFuncionario($entity: FuncionarioInput!) {
    data: saveFuncionario(funcionario: $entity) {
      id
      credito
      diarista
      sueldo
      fechaIngreso
      creadoEn
      fasePrueba
      activo
      nickname
      persona {
        id
        nombre
        telefono
      }
      cargo {
        id
        nombre
      }
      supervisadoPor {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const deleteFuncionarioQuery = gql`
  mutation deleteFuncionario($id: ID!) {
    deleteFuncionario(id: $id)
  }
`;
