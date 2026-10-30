import DOMPurify from 'dompurify';

/**
 * Las descripciones de producto contienen HTML enriquecido escrito por administradores.
 * Se sanean con una lista blanca estricta antes de usar dangerouslySetInnerHTML.
 * Este módulo solo se importa desde ProductDetailPage (ruta lazy) → DOMPurify
 * no pesa en la carga inicial.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li', 'br'],
    ALLOWED_ATTR: [],
  });
}
