import React, { useEffect, useState } from "react";
import "./Correcciones.css";

export default function Correcciones() {

  const [correcciones, setCorrecciones] = useState([]);

  // 🔹 Filtrar solo analizados (corregidos)
 const corregidas = correcciones;

  // 🔹 Cargar datos
  const cargarCorrecciones = () => {
    fetch("http://localhost:5000/api/entregas")
      .then((res) => res.json())
      .then((data) => {
        setCorrecciones(data);
      })
      .catch((err) => {
        console.error("Error:", err);
      });
  };

  useEffect(() => {
    cargarCorrecciones();
  }, []);

  // 🔹 Descargar archivo de observaciones (igual que Tesinas)
  const descargarObservaciones = (archivo) => {

    const url = `http://localhost:5000/uploads/${archivo}`;

    const link = document.createElement("a");
    link.href = url;
    link.download = `observado_${archivo}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const volverACorregir = async (id) => {
  try {

    await fetch(`http://localhost:5000/api/revertir/${id}`, {
      method: "POST"
    });

    // Recargar datos
    cargarCorrecciones();

  } catch (error) {
    console.error("Error al revertir:", error);
  }
};

  return (

    <div className="correcciones-container">

      <div className="correcciones-wrapper">

        <h1>Correcciones</h1>
        <p className="correcciones-subtitle">
          Tesinas revisadas y corregidas por docentes
        </p>

        {/* CONTADOR */}
        <p style={{ fontSize: "12px", color: "#6b7280" }}>
          Mostrando {corregidas.length} registros
        </p>

        <div className="correcciones-table-container">

          <table className="correcciones-table">

            <thead>
              <tr>
                <th>Alumno</th>
                <th>Tesina</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Calificación</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              {corregidas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No hay correcciones registradas
                  </td>
                </tr>
              ) : (

                corregidas.map((item) => (

                  <tr key={item.id}>

                    <td>{item.alumno_nombre}</td>

                    <td>{item.titulo}</td>

                    <td>
                      {new Date(item.fecha_entrega).toLocaleDateString()}
                    </td>

                    <td>
                      <span className={`estado ${item.estado}`}>
                        {item.estado}
                      </span>
                    </td>

                    <td>{item.calificacion_sistema || "-"}</td>

                    <td>
                      {item.observaciones ? (
                        <button
                          onClick={() => descargarObservaciones(item.archivo)}
                        >
                          ⬇ Descargar
                        </button>
                      ) : (
                        "Sin observaciones"
                      )}
                    </td>

                    <td>
  <button
    className="btn-revertir"
    onClick={() => volverACorregir(item.id)}
  >
    ↩ Volver
  </button>
</td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );
}