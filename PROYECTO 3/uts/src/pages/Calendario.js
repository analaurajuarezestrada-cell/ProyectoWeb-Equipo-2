import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import "./Calendario.css";

export default function Calendario() {

  const hoy = new Date();

  // estado de eventos
  const [eventos, setEventos] = useState([]);

  // obtener tareas desde backend
  useEffect(() => {

    fetch("http://localhost:5000/api/tareas")
      .then((res) => res.json())
      .then((data) => {

        const eventosFormateados = data.map((tarea) => ({
          title: tarea.titulo,
          start: tarea.fecha_entrega
        }));

        setEventos(eventosFormateados);

      })
      .catch((err) => console.error(err));

  }, []);

  // asignar colores por estado
  const eventosConEstado = eventos.map((evento) => {

    const fechaEvento = new Date(evento.start);

    const diferenciaDias = Math.ceil(
      (fechaEvento - hoy) / (1000 * 60 * 60 * 24)
    );

    let className = "event-normal";

    if (diferenciaDias <= 3 && diferenciaDias >= 0) {
      className = "event-warning";
    }
    else if (diferenciaDias < 0) {
      className = "event-expired";
    }

    return {
      ...evento,
      className
    };

  });

  return (
    <div className="calendario-container">

      <h1>Calendario Académico</h1>

      <p className="calendario-subtitle">
        Programación académica institucional
      </p>

      <div className="calendario-card">

        <FullCalendar
          plugins={[
            timeGridPlugin,
            dayGridPlugin,
            interactionPlugin
          ]}

          initialView="timeGridWeek"

          locale="es"

          firstDay={1}

          weekends={false}

          slotMinTime="07:00:00"

          slotMaxTime="21:00:00"

          allDaySlot={false}

          events={eventosConEstado}

          height="auto"

          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek"
          }}

          eventClick={(info) => {
            alert(info.event.title);
          }}

        />

      </div>

    </div>
  );
}