const crearCommentsXML = require("./comentariosXML");
const modificarDocumento = require("./modificarDocumento");
const agregarContentTypes = require("./agregarContentTypes");
const agregarRelacionComentarios = require("./agregarRelacionComentarios");
const { abrirDocumento, guardarDocumento } = require("./utilWord");

async function insertarComentariosWord(rutaEntrada, rutaSalida, comentarios) {

    // 🔥 FILTRAR DUPLICADOS ANTES DE PROCESAR
    const comentariosUnicos = [];
    const titulosVistos = new Set();
    
    comentarios.forEach(comentario => {
        // Si es un string (mensaje simple)
        if (typeof comentario === 'string') {
            const titulo = extraerTitulo(comentario);
            if (!titulosVistos.has(titulo)) {
                titulosVistos.add(titulo);
                comentariosUnicos.push(comentario);
            }
        } 
        // Si es un objeto con buscar y mensaje
        else if (comentario.buscar) {
            const titulo = comentario.buscar.toUpperCase();
            if (!titulosVistos.has(titulo)) {
                titulosVistos.add(titulo);
                comentariosUnicos.push(comentario);
            }
        } else {
            comentariosUnicos.push(comentario);
        }
    });

    console.log("🔍 Comentarios originales:", comentarios.length);
    console.log("✅ Comentarios únicos:", comentariosUnicos.length);

    // Abrir el .docx
    const zip = await abrirDocumento(rutaEntrada);

    console.log("====================================");
    console.log("DOCUMENTO ABIERTO CORRECTAMENTE");
    console.log("====================================");

    // Crear comments.xml
    const commentsXml = crearCommentsXML(comentariosUnicos);

    // Agregar comments.xml
    zip.file("word/comments.xml", commentsXml);
    console.log("comments.xml agregado");

    // Registrar comments.xml en Content Types
    await agregarContentTypes(zip);
    console.log("Content Types actualizado");

    // Registrar relación con document.xml
    await agregarRelacionComentarios(zip);
    console.log("Relación de comentarios agregada");

    // Modificar document.xml
    await modificarDocumento(zip, comentariosUnicos);
    console.log("document.xml modificado");

    // Guardar documento
    await guardarDocumento(zip, rutaSalida);
    console.log("Documento guardado correctamente.");
}

// Función auxiliar para extraer título de un mensaje
function extraerTitulo(mensaje) {
    const match = mensaje.match(/El título "([^"]+)"/);
    return match ? match[1].toUpperCase() : mensaje;
}

module.exports = insertarComentariosWord;