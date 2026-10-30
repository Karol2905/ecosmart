// ❌ ANTES: el HTML de la descripción se inyectaba sin sanear.
export const sanitizeHtml = (dirty: string): string => dirty;
