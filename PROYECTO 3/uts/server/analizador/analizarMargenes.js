const fs = require("fs");
const JSZip = require("jszip");

async function analizarMargenes(rutaArchivo) {
    try {
        const buffer = fs.readFileSync(rutaArchivo);
        const zip = await JSZip.loadAsync(buffer);
        const documentXml = await zip.file("word/document.xml").async("string");

        let errores = [];
        let correctos = [];

        console.log("📏 ANALIZANDO MÁRGENES DEL DOCUMENTO...");

        const pgMarMatch = documentXml.match(/<w:pgMar[^>]*>/);
        
        if (pgMarMatch) {
            const pgMar = pgMarMatch[0];
            console.log("📐 Márgenes encontrados (RAW):", pgMar);
            
            const top = pgMar.match(/w:top="([^"]+)"/);
            const bottom = pgMar.match(/w:bottom="([^"]+)"/);
            const left = pgMar.match(/w:left="([^"]+)"/);
            const right = pgMar.match(/w:right="([^"]+)"/);
            
            function twipsACm(twips) {
                return parseFloat((twips / 1440 * 2.54).toFixed(2));
            }
            
            // Valores esperados en cm (EXACTOS)
            const esperadoIzquierdo = 3.0;
            const esperadoSuperior = 2.5;
            const esperadoInferior = 2.5;
            const esperadoDerecho = 2.5;
            
            // 🔥 TOLERANCIA MUY ESTRICTA (prácticamente exacto)
            const tolerancia = 0.01;

            const erroresMargenes = [];
            let hayError = false;

            // Validar margen izquierdo (3 cm)
            if (left) {
                const valorLeft = parseFloat(left[1]);
                const cmActual = twipsACm(valorLeft);
                const diferencia = Math.abs(cmActual - esperadoIzquierdo);
                
                console.log(`📏 Margen izquierdo: ${valorLeft} twips = ${cmActual} cm`);
                
                if (diferencia <= tolerancia) {
                    correctos.push(`✅ Margen izquierdo: ${cmActual} cm (correcto)`);
                } else {
                    erroresMargenes.push(`El margen izquierdo debe ser de 3 cm (actual: ${cmActual} cm)`);
                    hayError = true;
                }
            }

            // Validar margen superior (2.5 cm)
            if (top) {
                const valorTop = parseFloat(top[1]);
                const cmActual = twipsACm(valorTop);
                const diferencia = Math.abs(cmActual - esperadoSuperior);
                
                console.log(`📏 Margen superior: ${valorTop} twips = ${cmActual} cm`);
                
                if (diferencia <= tolerancia) {
                    correctos.push(`✅ Margen superior: ${cmActual} cm (correcto)`);
                } else {
                    erroresMargenes.push(`El margen superior debe ser de 2.5 cm (actual: ${cmActual} cm)`);
                    hayError = true;
                }
            }

            // Validar margen inferior (2.5 cm)
            if (bottom) {
                const valorBottom = parseFloat(bottom[1]);
                const cmActual = twipsACm(valorBottom);
                const diferencia = Math.abs(cmActual - esperadoInferior);
                
                console.log(`📏 Margen inferior: ${valorBottom} twips = ${cmActual} cm`);
                
                if (diferencia <= tolerancia) {
                    correctos.push(`✅ Margen inferior: ${cmActual} cm (correcto)`);
                } else {
                    erroresMargenes.push(`El margen inferior debe ser de 2.5 cm (actual: ${cmActual} cm)`);
                    hayError = true;
                }
            }

            // Validar margen derecho (2.5 cm)
            if (right) {
                const valorRight = parseFloat(right[1]);
                const cmActual = twipsACm(valorRight);
                const diferencia = Math.abs(cmActual - esperadoDerecho);
                
                console.log(`📏 Margen derecho: ${valorRight} twips = ${cmActual} cm`);
                
                if (diferencia <= tolerancia) {
                    correctos.push(`✅ Margen derecho: ${cmActual} cm (correcto)`);
                } else {
                    erroresMargenes.push(`El margen derecho debe ser de 2.5 cm (actual: ${cmActual} cm)`);
                    hayError = true;
                }
            }

            // 🔥 SI HAY ERRORES, CREAR MENSAJE CON CADA MARGEN EN UNA LÍNEA
            if (hayError) {
                let mensaje = `Los márgenes del documento no son correctos.\n`;
                
                // Agregar cada error de margen en una línea separada
                erroresMargenes.forEach(error => {
                    mensaje += error + '\n';
                });
                
                errores.push(mensaje);
            }

            // RESUMEN
            console.log("📊 RESUMEN DE MÁRGENES:");
            if (left) console.log(`  Izquierdo: ${twipsACm(parseFloat(left[1]))} cm (debe ser 3 cm)`);
            if (top) console.log(`  Superior: ${twipsACm(parseFloat(top[1]))} cm (debe ser 2.5 cm)`);
            if (bottom) console.log(`  Inferior: ${twipsACm(parseFloat(bottom[1]))} cm (debe ser 2.5 cm)`);
            if (right) console.log(`  Derecho: ${twipsACm(parseFloat(right[1]))} cm (debe ser 2.5 cm)`);

        } else {
            errores.push("No se encontraron los márgenes del documento");
        }

        console.log(`📏 Análisis de márgenes completado. Errores: ${errores.length}, Aciertos: ${correctos.length}`);

        return {
            correcto: errores.length === 0,
            correctos,
            errores
        };

    } catch (error) {
        console.error("❌ Error en analizarMargenes:", error);
        return {
            correcto: false,
            mensaje: error.message,
            errores: [`Error al analizar márgenes: ${error.message}`],
            correctos: []
        };
    }
}

module.exports = analizarMargenes;