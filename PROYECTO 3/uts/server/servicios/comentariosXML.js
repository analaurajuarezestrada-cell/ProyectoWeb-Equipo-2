// comentariosXML.js

function crearCommentsXML(comentarios) {
    function escapeXml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    if (!comentarios || comentarios.length === 0) {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>';
    }

    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    xml += '<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n';

    comentarios.forEach((comentario, index) => {
        let mensaje = '';
        if (typeof comentario === 'string') {
            mensaje = comentario;
        } else if (comentario && comentario.mensaje) {
            mensaje = comentario.mensaje;
        } else {
            mensaje = 'Comentario sin mensaje';
        }

        // 🔥 ELIMINAR CUALQUIER SÍMBOLO O EMOJI
        mensaje = mensaje.replace(/[❌✅•⚠️⭐🎯🔍📌]/g, '');
        // 🔥 ELIMINAR VIÑETAS Y GUIONES AL INICIO
        mensaje = mensaje.replace(/^[•\-*]\s*/, '');
        // 🔥 ELIMINAR ESPACIOS EXTRA
        mensaje = mensaje.trim();

        const mensajeEscapado = escapeXml(mensaje);
        const mensajeConSaltos = mensajeEscapado.replace(/\n/g, '<w:br/>');

        xml += `  <w:comment w:id="${index}" w:author="DocWise" w:initials="DW" w:date="2026-07-28T00:00:00Z">\n`;
        xml += `    <w:p>\n`;
        xml += `      <w:r>\n`;
        xml += `        <w:t>${mensajeConSaltos}</w:t>\n`;
        xml += `      </w:r>\n`;
        xml += `    </w:p>\n`;
        xml += `  </w:comment>\n`;
    });

    xml += '</w:comments>';
    return xml;
}

module.exports = crearCommentsXML;