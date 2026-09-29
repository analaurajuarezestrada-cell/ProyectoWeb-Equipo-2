async function agregarRelacionComentarios(zip) {
    let rels = await zip.file("word/_rels/document.xml.rels").async("string");

    // Si ya existe, no hacer nada
    if (rels.includes("comments.xml")) {
        return;
    }

    // Buscar el ID más alto existente
    const ids = rels.match(/Id="rId(\d+)"/g);
    let maxId = 0;
    if (ids) {
        ids.forEach(id => {
            const num = parseInt(id.match(/\d+/)[0]);
            if (num > maxId) maxId = num;
        });
    }
    const newId = maxId + 1;

    const relacion = `
<Relationship Id="rId${newId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>`;

    rels = rels.replace(
        "</Relationships>",
        relacion + "\n</Relationships>"
    );

    zip.file("word/_rels/document.xml.rels", rels);
}

module.exports = agregarRelacionComentarios;