// agregarContentTypes.js

async function agregarContentTypes(zip) {
    try {
        console.log("📝 Agregando Content Types para comments.xml...");
        
        let content = await zip.file("[Content_Types].xml").async("string");

        if (!content.includes("/word/comments.xml")) {
            // 🔥 IMPORTANTE: SIN SALTOS DE LÍNEA
            content = content.replace(
                "</Types>",
                `<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/></Types>`
            );
            
            zip.file("[Content_Types].xml", content);
            console.log("✅ Content Types actualizado");
        } else {
            console.log("ℹ️ comments.xml ya existe");
        }
        
        return true;
    } catch (error) {
        console.error("❌ Error:", error.message);
        throw error;
    }
}

module.exports = agregarContentTypes;