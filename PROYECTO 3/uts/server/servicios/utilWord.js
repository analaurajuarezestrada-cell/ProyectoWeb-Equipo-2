const fs = require("fs");
const JSZip = require("jszip");


// Abrir un archivo .docx como ZIP
async function abrirDocumento(rutaArchivo) {

    const buffer = fs.readFileSync(rutaArchivo);

    const zip = await JSZip.loadAsync(buffer);

    return zip;

}


// Agregar soporte de comentarios para Word
async function agregarSoporteComentarios(zip) {


    // 1. Registrar comments.xml en [Content_Types].xml

    let contentTypes = await zip
        .file("[Content_Types].xml")
        .async("string");


    if (!contentTypes.includes("comments+xml")) {

        contentTypes = contentTypes.replace(
            "</Types>",
            `
<Override 
PartName="/word/comments.xml"
ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>
</Types>
`
        );

        zip.file(
            "[Content_Types].xml",
            contentTypes
        );

    }



    // 2. Crear relación entre document.xml y comments.xml

    let relaciones = await zip
        .file("word/_rels/document.xml.rels")
        .async("string");


    if (!relaciones.includes("comments.xml")) {

        relaciones = relaciones.replace(
            "</Relationships>",
            `
<Relationship
Id="rId100"
Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments"
Target="comments.xml"/>
</Relationships>
`
        );


        zip.file(
            "word/_rels/document.xml.rels",
            relaciones
        );

    }

}



// Guardar nuevamente el .docx
async function guardarDocumento(zip, rutaSalida) {

    const contenido = await zip.generateAsync({
        type: "nodebuffer"
    });

    fs.writeFileSync(rutaSalida, contenido);

}


module.exports = {
    abrirDocumento,
    guardarDocumento,
    agregarSoporteComentarios
};