import React, { useEffect, useState } from "react";
import "./NotificacionesDocente.css";

export default function NotificacionesDocente() {

  const [notificaciones, setNotificaciones] = useState([]);

  // Cambia este ID por el del docente que haya iniciado sesión
  const usuario_id = 2;

  useEffect(() => {
    obtenerNotificaciones();
  }, []);

  const obtenerNotificaciones = () => {
    fetch(`http://localhost:5000/api/notificaciones/${usuario_id}`)
      .then((res) => res.json())
      .then((data) => {
        setNotificaciones(data);
      })
      .catch((err) => {
        console.error("Error al obtener notificaciones:", err);
      });
  };

  return (
    <div className="notif-docente-container">

      <h2>🔔 Notificaciones – Docente</h2>

      <div className="notif-list">

        {notificaciones.length === 0 ? (

          <p>No hay notificaciones.</p>

        ) : (

          notificaciones.map((n) => (

            <div
              key={n.id}
              className={`notif-card ${n.tipo === "urgente" ? "urgente" : ""}`}
            >

              <div className="notif-header">

                <span className="notif-title">
                  {n.titulo}
                </span>

                <span className="notif-date">
                  {new Date(n.fecha).toLocaleDateString()}
                </span>

              </div>

              <p className="notif-message">
                {n.mensaje}
              </p>

            </div>

          ))

        )}

      </div>

    </div>
  );
}