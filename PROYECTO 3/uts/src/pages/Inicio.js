import "./Inicio.css";

const Inicio = () => {
  return (
    <div className="inicio">

      <h1>Inicio</h1>
      <p className="subtitulo">
        Bienvenido al sistema de gestión de tesinas
      </p>

      {/* Tarjetas resumen */}
      <div className="cards">
        <div className="card blue">
          <h3>Documentos</h3>
          <p>4 Subidos</p>
        </div>

        <div className="card green">
          <h3>Actividades</h3>
          <p>2 Pendientes</p>
        </div>

        <div className="card yellow">
          <h3>Tesina</h3>
          <p>En revisión</p>
        </div>

        <div className="card red">
          <h3>Notificaciones</h3>
          <p>5 Nuevas</p>
        </div>
      </div>

      {/* Estado de tesina */}
      <div className="panel">
        <h2>Estado de la Tesina</h2>
        <p><strong>Última revisión:</strong> 10 / Mayo / 2026</p>
        <p><strong>Observaciones:</strong> 3 pendientes</p>
        <p><strong>Calificación estimada:</strong> 8.5</p>
      </div>

      {/* Acciones rápidas */}
      <div className="panel">
        <h2>Acciones rápidas</h2>
        <div className="acciones">
          <button>Subir documento</button>
          <button>Ver correcciones</button>
          <button>Ver videos</button>
          <button>Descargar formatos</button>
        </div>
      </div>

      {/* Avisos */}
      <div className="panel">
        <h2>Avisos</h2>
        <ul>
          <li>📢 Fecha límite de entrega: 20 de mayo</li>
          <li>✏️ Nuevas observaciones en tu tesina</li>
          <li>🎥 Nuevo video disponible</li>
        </ul>
      </div>

    </div>
  );
};

export default Inicio;
