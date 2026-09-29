const fs = require('fs');
const JSZip = require('jszip');

async function testTamanio() {
    try {
        // CAMBIA ESTA RUTA POR LA DE TU DOCUMENTO
        const ruta = '../uploads/1787901642039.docx';
        const buffer = fs.readFileSync(ruta);
        const zip = await JSZip.loadAsync(buffer);
        const documentXml = await zip.file('word/document.xml').async('string');
        const stylesXml = await zip.file('word/styles.xml').async('string');

        console.log('🔍 ANALIZANDO TAMAÑOS DE PÁRRAFOS...\n');

        const parrafos = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];

        parrafos.forEach((parrafo, index) => {
            const texto = [...parrafo.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)]
                .map(t => t[1])
                .join('')
                .trim();

            if (texto.length === 0) return;

            // Buscar tamaño
            let tamanio = null;
            const szMatch = parrafo.match(/<w:sz\b[^>]*w:val="([^"]+)"/);
            if (szMatch) {
                tamanio = parseInt(szMatch[1]) / 2;
            }

            // Buscar si es título
            const esTitulo = 
                parrafo.includes('w:b') || 
                parrafo.includes('w:jc w:val="center"') ||
                parrafo.includes('w:sz w:val="28"') ||
                /^[IVXLCDM]+\./.test(texto) ||
                /^\d+\.\d+/.test(texto) ||
                /^[IVXLCDM]+\.\d+/.test(texto);

            console.log(`[${index}] TAMAÑO: ${tamanio || 'NO DEFINIDO'} pt | TÍTULO: ${esTitulo ? 'SI' : 'NO'} | TEXTO: "${texto.substring(0, 50)}..."`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testTamanio();