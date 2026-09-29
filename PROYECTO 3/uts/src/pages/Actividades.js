import { useEffect, useState } from "react";
import "./Actividades.css";

function Actividades() {
  const [actividades, setActividades] = useState([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [entregado, setEntregado] = useState(false);

  // 🔥 Estados del modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");
  const [accionPendiente, setAccionPendiente] = useState(null);

  const alumno_id = localStorage.getItem("userId");

  useEffect(() => {
    fetch("http://localhost:5000/api/tareas")
      .then((res) => res.json())
      .then((data) => {
        setActividades(data);
      })
      .catch((err) => {
        console.error("Error:", err);
      });
  }, []);

  // 🔎 Verificar si ya entregó
  const verificarEntrega = async (tarea_id) => {
    const response = await fetch(
      `http://localhost:5000/api/entregas/${tarea_id}/${alumno_id}`
    );

    const data = await response.json();
    setEntregado(data.entregado);
  };

  // 🔥 Abrir modal
  const abrirModal = (mensaje, accion) => {
    setMensajeModal(mensaje);
    setAccionPendiente(() => accion);
    setMostrarModal(true);
  };

  // ✅ Confirmar entrega
  const entregarConfirmado = async () => {
    try {
      const formData = new FormData();
      formData.append("tarea_id", actividadSeleccionada.id);
      formData.append("alumno_id", alumno_id);
      formData.append("archivo", archivo);

      const response = await fetch(
        "http://localhost:5000/api/entregas",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) return;

      setEntregado(true);
      setArchivo(null);
      setMostrarModal(false);

    } catch (error) {
      console.error(error);
    }
  };

  // ❌ Confirmar anulación
  const anularEntregaConfirmado = async () => {
    await fetch(
      `http://localhost:5000/api/entregas/${actividadSeleccionada.id}/${alumno_id}`,
      { method: "DELETE" }
    );

    setEntregado(false);
    setMostrarModal(false);
  };

  // 📤 Click entregar (abre modal)
  const entregarTarea = () => {
    if (!archivo) return;

    abrirModal(
      "¿Confirmas que deseas entregar este archivo?",
      entregarConfirmado
    );
  };

  // 🔁 Click anular (abre modal)
  const anularEntrega = () => {
    abrirModal(
      "¿Estás seguro que deseas anular la entrega?",
      anularEntregaConfirmado
    );
  };

  // 🔥 VISTA DETALLE
  if (actividadSeleccionada) {
    return (
      <div className="actividades-container">
        <div className="actividad-detalle">
          <button
            className="volver-btn"
            onClick={() => {
              setActividadSeleccionada(null);
              setEntregado(false);
            }}
          >
            ← Volver a actividades
          </button>

          <h2 className="detalle-titulo">
            {actividadSeleccionada.titulo}
          </h2>

          <p className="detalle-info">
            Publicado por {actividadSeleccionada.autor} ·{" "}
            {new Date(
              actividadSeleccionada.fecha_creacion
            ).toLocaleDateString()}
          </p>

          <div className="detalle-instrucciones">
            {actividadSeleccionada.instrucciones}
          </div>

          {actividadSeleccionada.archivo && (
            <div style={{ marginBottom: "20px" }}>
              <a
                href={`http://localhost:5000/uploads/${actividadSeleccionada.archivo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="actividad-btn"
              >
                📄 Ver instrucciones completas (PDF)
              </a>
            </div>
          )}

          {/* 🔥 BLOQUE DE ENTREGA */}
          <div className="entrega-box">
            {entregado ? (
              <>
                <h3 style={{ color: "green" }}>✅ Entregado</h3>

                <button
                  className="entrega-btn"
                  style={{ backgroundColor: "#d32f2f", marginTop: "10px" }}
                  onClick={anularEntrega}
                >
                  Anular entrega
                </button>
              </>
            ) : (
              <>
                <h3>Subir avance de tesina</h3>

                <input
                  type="file"
                  accept=".doc,.docx"
                  onChange={(e) => setArchivo(e.target.files[0])}
                />

                <button
                  className="entrega-btn"
                  onClick={entregarTarea}
                  style={{ marginTop: "15px" }}
                >
                  Entregar archivo
                </button>
              </>
            )}
          </div>
        </div>

        {/* 🔥 MODAL */}
        {mostrarModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <p>{mensajeModal}</p>

              <div className="modal-actions">
                <button
                  className="btn-cancelar"
                  onClick={() => setMostrarModal(false)}
                >
                  Cancelar
                </button>

                <button
                  className="btn-publicar"
                  onClick={accionPendiente}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🔥 LISTA NORMAL
  return (
    <div className="actividades-container">
      <h1 className="actividades-title">Actividades</h1>

      <div className="actividades-list">
        {actividades.length === 0 ? (
          <p>No hay actividades disponibles</p>
        ) : (
          actividades.map((act) => (
            <div className="actividad-card" key={act.id}>
              <div className="actividad-header">
                <span>{act.autor}</span>
                <span>
                  {new Date(act.fecha_creacion).toLocaleDateString()}
                </span>
              </div>

              <h3>{act.titulo}</h3>
              <p>{act.instrucciones}</p>

              <button
                className="actividad-btn"
                onClick={() => {
                  setActividadSeleccionada(act);
                  verificarEntrega(act.id);
                }}
              >
                Ver actividad
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Actividades;