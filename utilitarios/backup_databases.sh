#!/bin/bash

# Script para hacer backups de bases de datos remotas
# Uso: ./backup_databases.sh [servidor|general|ambas]

# Configuración de variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Función para hacer backup de la base de datos servidor
backup_servidor() {
    echo "Iniciando backup de base de datos 'servidor'..."
    
    # Variables para la conexión
    export DB_HOST="172.25.1.200"
    export DB_PORT="5551"
    export DB_NAME="servidor"
    export BACKUP_FILE="$BACKUP_DIR/servidor_backup_$TIMESTAMP.sql"
    
    # Comando de backup usando psql con variables
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -v backup_file="$BACKUP_FILE" -c "
        -- Backup de la base de datos servidor
        COPY (
            SELECT '-- Backup iniciado el ' || now()::text as backup_info
        ) TO STDOUT;
        
        -- Aquí puedes agregar más comandos específicos para el backup
        -- Por ejemplo, exportar tablas específicas o datos
    " > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup de 'servidor' completado: $BACKUP_FILE"
    else
        echo "❌ Error en backup de 'servidor'"
        return 1
    fi
}

# Función para hacer backup de la base de datos general
backup_general() {
    echo "Iniciando backup de base de datos 'general'..."
    
    # Variables para la conexión
    export DB_HOST="172.25.1.6"
    export DB_PORT="5551"
    export DB_NAME="general"
    export BACKUP_FILE="$BACKUP_DIR/general_backup_$TIMESTAMP.sql"
    
    # Comando de backup usando psql con variables
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -v backup_file="$BACKUP_FILE" -c "
        -- Backup de la base de datos general
        COPY (
            SELECT '-- Backup iniciado el ' || now()::text as backup_info
        ) TO STDOUT;
        
        -- Aquí puedes agregar más comandos específicos para el backup
        -- Por ejemplo, exportar tablas específicas o datos
    " > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup de 'general' completado: $BACKUP_FILE"
    else
        echo "❌ Error en backup de 'general'"
        return 1
    fi
}

# Función para hacer backup completo usando pg_dump
backup_complete_servidor() {
    echo "Iniciando backup completo de base de datos 'servidor'..."
    
    export DB_HOST="172.25.1.200"
    export DB_PORT="5551"
    export DB_NAME="servidor"
    export BACKUP_FILE="$BACKUP_DIR/servidor_complete_backup_$TIMESTAMP.sql"
    
    # Backup completo con pg_dump
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --file="$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup completo de 'servidor' completado: $BACKUP_FILE"
        echo "📊 Tamaño del archivo: $(du -h "$BACKUP_FILE" | cut -f1)"
    else
        echo "❌ Error en backup completo de 'servidor'"
        return 1
    fi
}

# Función para hacer backup completo usando pg_dump
backup_complete_general() {
    echo "Iniciando backup completo de base de datos 'general'..."
    
    export DB_HOST="172.25.1.6"
    export DB_PORT="5551"
    export DB_NAME="general"
    export BACKUP_FILE="$BACKUP_DIR/general_complete_backup_$TIMESTAMP.sql"
    
    # Backup completo con pg_dump
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
        --verbose \
        --no-password \
        --format=plain \
        --file="$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup completo de 'general' completado: $BACKUP_FILE"
        echo "📊 Tamaño del archivo: $(du -h "$BACKUP_FILE" | cut -f1)"
    else
        echo "❌ Error en backup completo de 'general'"
        return 1
    fi
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  servidor     - Backup de la base de datos 'servidor' (172.25.1.200:5551)"
    echo "  general      - Backup de la base de datos 'general' (172.25.1.6:5551)"
    echo "  ambas        - Backup de ambas bases de datos"
    echo "  completo     - Backup completo de ambas bases de datos usando pg_dump"
    echo "  help         - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 servidor"
    echo "  $0 general"
    echo "  $0 ambas"
    echo "  $0 completo"
}

# Procesar argumentos
case "${1:-help}" in
    "servidor")
        backup_servidor
        ;;
    "general")
        backup_general
        ;;
    "ambas")
        echo "🔄 Iniciando backup de ambas bases de datos..."
        backup_servidor && backup_general
        ;;
    "completo")
        echo "🔄 Iniciando backup completo de ambas bases de datos..."
        backup_complete_servidor && backup_complete_general
        ;;
    "help"|*)
        show_help
        ;;
esac

echo ""
echo "📁 Archivos de backup guardados en: $BACKUP_DIR"
echo "📅 Timestamp: $TIMESTAMP"


