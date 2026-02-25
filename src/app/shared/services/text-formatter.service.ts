import { Injectable } from '@angular/core';
@Injectable({
    providedIn: 'root'
})
export class TextFormatterService {
    escaparHtml(texto: string): string {
        if (!texto) return '';

        return texto
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    formatearMenciones(texto: string): string {
        if (!texto) return '';

        return texto.replace(
            /@([a-zA-Z0-9_]+)/g,
            '<span class="mention">@$1</span>'
        );
    }
    formatearSaltosLinea(texto: string): string {
        if (!texto) return '';
        return texto.replace(/\n/g, '<br>');
    }
    formatearComentario(comentario: string): string {
        if (!comentario) return '';

        const textoEscapado = this.escaparHtml(comentario);
        const textoConMenciones = this.formatearMenciones(textoEscapado);
        return this.formatearSaltosLinea(textoConMenciones);
    }
}
