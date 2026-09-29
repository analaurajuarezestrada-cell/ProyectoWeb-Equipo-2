import React, { useState } from "react";
import "./Manuales.css";

export default function Manuales() {
  const [search, setSearch] = useState("");

  const manuales = [
    {
      id: 1,
      titulo: "Manual para Portada de Tesina",
      descripcion: "Guía para llenar correctamente la portada institucional.",
      archivo: "#"
    },
    {
      id: 2,
      titulo: "Manual de Estructura del Documento",
      descripcion: "Explica la estructura correcta de la tesina y sus apartados.",
      archivo: "#"
    },
    {
      id: 3,
      titulo: "Manual de Citas y Referencias APA",
      descripcion: "Guía básica para citar correctamente en formato APA.",
      archivo: "#"
    },
    {
      id: 4,
      titulo: "Manual para Entrega Final de Tesina",
      descripcion: "Pasos y requisitos para la entrega final del documento.",
      archivo: "#"
    }
  ];

  const manualesFiltrados = manuales.filter((manual) =>
    manual.titulo.toLowerCase().includes(search.toLowerCase()) ||
    manual.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="manuales-container">
      <h1>Manuales</h1>
      <p className="manuales-subtitle">
        Consulta y descarga los manuales oficiales para el llenado de documentos
      </p>

      {/* Buscador */}
      <div className="manuales-search">
        <input
          type="text"
          placeholder="Buscar manual..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="manuales-grid">
        {manualesFiltrados.length > 0 ? (
          manualesFiltrados.map((manual) => (
            <div className="manual-card" key={manual.id}>
              <div className="manual-header">
                <span className="manual-icon">📘</span>
              </div>

              <h3>{manual.titulo}</h3>
              <p>{manual.descripcion}</p>

              <div className="manual-actions">
                <a href={manual.archivo} className="btn-ver">
                  Ver
                </a>
                <a href={manual.archivo} className="btn-descargar">
                  Descargar
                </a>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#6c757d", fontSize: "0.9rem" }}>
            No se encontraron manuales.
          </p>
        )}
      </div>
    </div>
  );
}
