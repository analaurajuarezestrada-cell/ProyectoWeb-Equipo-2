// insertarComentariosWord.js

const crearCommentsXML = require("./comentariosXML");
const modificarDocumento = require("./modificarDocumento");
const agregarContentTypes = require("./agregarContentTypes");
const agregarRelacionComentarios = require("./agregarRelacionComentarios");
const { abrirDocumento, guardarDocumento } = require("./utilWord");

async function insertarComentariosWord(rutaEntrada, rutaSalida, comentarios) {
    console.log("=========================================");
    console.log("📝 INSERTANDO COMENTARIOS EN WORD");
    console.log("=========================================");
    console.log(`📊 Comentarios a insertar: ${comentarios.length}`);

    // 🔥 FILTRAR COMENTARIOS VÁLIDOS
    const comentariosValidos = comentarios.filter(c => {
        if (typeof c === 'string') return c.trim().length > 0;
        if (typeof c === 'object' && c.mensaje) return c.mensaje.trim().length > 0;
        return false;
    });

    if (comentariosValidos.length === 0) {
        console.log("⚠️ No hay comentarios válidos");
        const fs = require('fs');
        fs.copyFileSync(rutaEntrada, rutaSalida);
        return;
    }

    try {
        // 🔥 ABRIR DOCUMENTO
        const zip = await abrirDocumento(rutaEntrada);
        console.log("✅ Documento abierto");

        // 🔥 CREAR Y AGREGAR comments.xml
        const commentsXml = crearCommentsXML(comentariosValidos);
        zip.file("word/comments.xml", commentsXml);
        console.log("✅ comments.xml creado");

        // 🔥 ACTUALIZAR Content Types
        await agregarContentTypes(zip);
        console.log("✅ Content Types actualizado");

        // 🔥 AGREGAR RELACIÓN
        await agregarRelacionComentarios(zip);
        console.log("✅ Relación agregada");

        // 🔥 MODIFICAR DOCUMENTO
        await modificarDocumento(zip, comentariosValidos);
        console.log("✅ Documento modificado");

        // 🔥 GUARDAR
        await guardarDocumento(zip, rutaSalida);
        console.log("✅ Documento guardado");

        console.log("=========================================");
        console.log("✅ ¡PROCESO COMPLETADO!");
        console.log("=========================================");

    } catch (error) {
        console.error("❌ Error:", error.message);
        throw error;
    }
}

module.exports = insertarComentariosWord;