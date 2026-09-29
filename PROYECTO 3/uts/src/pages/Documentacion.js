import { useRef, useState } from "react";
import mammoth from "mammoth";
import "./Documentacion.css";

/* ===============================
   ANALIZADOR DE CORRECCIONES
================================ */
const analizarCorrecciones = (texto) => {
  const errores = [];

  if (!texto || texto.trim() === "") {
    errores.push("El documento no contiene texto");
    return errores;
  }

  if (texto.includes("  ")) {
    errores.push("Se detectaron dobles espacios innecesarios");
  }

  const lineas = texto.split("\n").filter(l => l.trim() !== "");
  lineas.forEach((l, i) => {
    if (l.length < 25) {
      errores.push(`El párrafo ${i + 1} es demasiado corto`);
    }
  });

  return errores;
};

const Documentacion = () => {
  const fileInputRef = useRef(null);

  const [archivo, setArchivo] = useState(null);
  const [htmlDoc, setHtmlDoc] = useState("");
  const [errores, setErrores] = useState([]);
  const [zoom, setZoom] = useState(1);

  /* ===== SUBIR WORD ===== */
  const handleArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      alert("❌ Solo se permiten archivos Word (.docx)");
      return;
    }

    setArchivo(file);

    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });

    setHtmlDoc(result.value);

    const textoPlano = result.value.replace(/<[^>]+>/g, "");
    setErrores(analizarCorrecciones(textoPlano));
  };

  return (
    <div className="documentacion">

      <h1>Documentación académica</h1>
      <p className="doc-subtitle">
        Sistema de revisión y validación de tesinas digitales
      </p>

      {/* ===== ACCIONES ===== */}
      <div className="doc-actions">
        <label className="upload-btn">
          Subir documento Word
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            hidden
            onChange={handleArchivo}
          />
        </label>
      </div>

      {archivo && (
        <p className="archivo-cargado">
          📄 Documento cargado: <strong>{archivo.name}</strong>
        </p>
      )}

      {/* ===== RESULTADOS ===== */}
      {archivo && (
        <div className="results-layout">

          {/* IZQUIERDA */}
          <aside className="results-left">
            <div className="stats-panel">
              <h3>Observaciones</h3>
              <p>Total detectadas: <strong>{errores.length}</strong></p>
            </div>

            {errores.length > 0 && (
              <div className="observations-section">
                <ul>
                  {errores.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* DERECHA */}
          <section className="results-right">
            <div className="preview-panel">

              {/* TOOLBAR */}
              <div className="viewer-toolbar">
                <button onClick={() => setZoom(z => Math.max(0.7, z - 0.1))}>−</button>
                <span>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.6, z + 0.1))}>+</button>
              </div>

              {/* VISOR */}
              <div className="document-viewer">
                <div
                  className="document-content"
                  style={{ transform: `scale(${zoom})` }}
                  dangerouslySetInnerHTML={{ __html: htmlDoc }}
                />
              </div>

            </div>
          </section>

        </div>
      )}

    </div>
  );
};

export default Documentacion;
