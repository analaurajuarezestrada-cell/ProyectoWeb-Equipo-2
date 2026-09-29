const fs = require("fs");
const JSZip = require("jszip");

async function analizarJustificacion(rutaArchivo) {
    try {
        const buffer = fs.readFileSync(rutaArchivo);
        const zip = await JSZip.loadAsync(buffer);
        const documentXml = await zip.file("word/document.xml").async("string");
        const stylesXml = await zip.file("word/styles.xml").async("string");

        let errores = [];
        let correctos = [];

        console.log("📐 ANALIZANDO JUSTIFICACIÓN DEL DOCUMENTO...");

        // 🔥 BUSCAR TODOS LOS PÁRRAFOS
        const parrafos = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g);
        
        if (!parrafos || parrafos.length === 0) {
            errores.push("No se encontraron párrafos en el documento");
            return {
                correcto: false,
                correctos,
                errores
            };
        }

        // 🔥 FUNCIÓN: Verificar si un párrafo está justificado
        function estaJustificado(parrafo, stylesXml) {
            // 🔥 SI TIENE ALINEACIÓN IZQUIERDA, NO ESTÁ JUSTIFICADO
            if (parrafo.includes('w:jc w:val="left"')) {
                return false;
            }
            
            // 🔥 SI TIENE ALINEACIÓN CENTRADA, ES TÍTULO (SE SALTA)
            if (parrafo.includes('w:jc w:val="center"')) {
                return true; // Lo consideramos justificado para que no marque error
            }
            
            // 🔥 SI TIENE ALINEACIÓN DERECHA, NO ESTÁ JUSTIFICADO
            if (parrafo.includes('w:jc w:val="right"')) {
                return false;
            }
            
            // 🔥 SI TIENE JUSTIFICACIÓN DIRECTA, ESTÁ JUSTIFICADO
            if (parrafo.includes('w:jc w:val="both"')) {
                return true;
            }
            
            // 🔥 BUSCAR EN EL ESTILO DEL PÁRRAFO
            const estiloMatch = parrafo.match(/<w:pStyle\b[^>]*w:val="([^"]+)"/);
            if (estiloMatch) {
                const estiloId = estiloMatch[1];
                const regex = new RegExp(`<w:style\\b[^>]*w:styleId="${estiloId}"[\\s\\S]*?<\\/w:style>`);
                const estiloXml = stylesXml.match(regex);
                if (estiloXml) {
                    const estilo = estiloXml[0];
                    
                    // Si el estilo tiene justificación
                    if (estilo.includes('w:jc w:val="both"')) {
                        return true;
                    }
                    
                    // Si el estilo tiene alineación izquierda
                    if (estilo.includes('w:jc w:val="left"')) {
                        return false;
                    }
                    
                    // Si el estilo tiene alineación derecha
                    if (estilo.includes('w:jc w:val="right"')) {
                        return false;
                    }
                }
            }
            
            // 🔥 SI NO ENCUENTRA NADA, ASUMIR QUE ESTÁ JUSTIFICADO (evita falsos positivos)
            return true;
        }

        let parrafosNoJustificados = 0;
        let parrafosTotales = 0;

        parrafos.forEach((parrafo, index) => {
            // Extraer texto del párrafo
            const texto = [...parrafo.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)]
                .map(t => t[1])
                .join("")
                .trim();

            // Saltar párrafos vacíos
            if (texto.length === 0) return;
            
            // Saltar títulos (detectar si tiene formato de título)
            const esTitulo = 
                parrafo.includes('w:b') || 
                parrafo.includes('w:jc w:val="center"') ||
                parrafo.includes('w:sz w:val="28"');
            
            if (esTitulo) return;

            parrafosTotales++;

            // 🔥 VERIFICAR SI ESTÁ JUSTIFICADO
            const justificado = estaJustificado(parrafo, stylesXml);
            
            if (!justificado) {
                parrafosNoJustificados++;
                console.log(`⚠️ Párrafo ${index} NO está justificado: "${texto.substring(0, 50)}..."`);
            }
        });

        console.log(`📊 Total de párrafos analizados: ${parrafosTotales}`);
        console.log(`📊 Párrafos NO justificados: ${parrafosNoJustificados}`);

        // 🔥 SI HAY PÁRRAFOS NO JUSTIFICADOS, MARCAR ERROR
        if (parrafosNoJustificados > 0) {
            const mensaje = `El texto del documento no está justificado.`;
            errores.push(mensaje);
        } else {
            correctos.push("✅ El documento está completamente justificado.");
        }

        console.log(`📐 Análisis de justificación completado. Errores: ${errores.length}, Aciertos: ${correctos.length}`);

        return {
            correcto: errores.length === 0,
            correctos,
            errores
        };

    } catch (error) {
        console.error("❌ Error en analizarJustificacion:", error);
        return {
            correcto: false,
            mensaje: error.message,
            errores: [`Error al analizar justificación: ${error.message}`],
            correctos: []
        };
    }
}

module.exports = analizarJustificacion;