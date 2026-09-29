async function modificarRelaciones(zip){

    let rels = await zip.file("word/_rels/document.xml.rels").async("string");

    if(!rels.includes("comments.xml")){

        rels = rels.replace(
            "</Relationships>",
            `
            <Relationship
                Id="rId999"
                Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments"
                Target="comments.xml"/>

            </Relationships>
            `
        );

        zip.file("word/_rels/document.xml.rels", rels);

    }

}

module.exports = modificarRelaciones;