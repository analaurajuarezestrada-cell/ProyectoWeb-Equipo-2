import "./Topbar.css";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import userPhoto from "../logo.png";

const Topbar = ({ toggleSidebar, setVista }) => {

  const [pendientes, setPendientes] = useState([]);
  const [nuevas, setNuevas] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const [userName, setUserName] = useState("Usuario");
  const [userCarrera, setUserCarrera] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef(null);
  const navigate = useNavigate();

  // 🔹 Cargar usuario
  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedCarrera = localStorage.getItem("userCarrera");
    const userUsuario = localStorage.getItem("userUsuario");

    if (storedName && storedName !== "Usuario") {
      setUserName(storedName);
    } else if (userUsuario) {
      setUserName(userUsuario);
    }

    if (storedCarrera) {
      setUserCarrera(storedCarrera);
    }
  }, []);

  // 🔹 Cerrar menú
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔥 CARGAR TODO
  const cargarDatos = () => {
    fetch("http://localhost:5000/api/entregas")
      .then((res) => res.json())
      .then((data) => {

        const hoy = new Date();

        // 🔔 Pendientes
        const pendientesFiltrados = data.filter(
          t => t.estado !== "analizado"
        );

        // ✉️ Nuevas (hoy)
        const nuevasFiltradas = data.filter(t => {
          const fecha = new Date(t.fecha_entrega);
          return fecha.toDateString() === hoy.toDateString();
        });

        // 🚩 Atrasadas (>3 días sin analizar)
        const alertasFiltradas = data.filter(t => {
          const fecha = new Date(t.fecha_entrega);
          const diff = (hoy - fecha) / (1000 * 60 * 60 * 24);

          return t.estado !== "analizado" && diff > 3;
        });

        setPendientes(pendientesFiltrados);
        setNuevas(nuevasFiltradas);
        setAlertas(alertasFiltradas);

      })
      .catch((err) => console.error("Error:", err));
  };

  // 🔥 ACTUALIZACIÓN AUTOMÁTICA
  useEffect(() => {
    cargarDatos();

    const intervalo = setInterval(() => {
      cargarDatos();
    }, 3000); // recomendado

    return () => clearInterval(intervalo);
  }, []);

  // 🔹 Logout
  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userUsuario");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userCarrera");
    localStorage.removeItem("token");

    window.location.href = "/login";
  };

  return (
    <header className="topbar">

      {/* IZQUIERDA */}
      <div className="topbar-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          ☰
        </button>
        <span className="logo">DocWise System</span>
      </div>

      {/* DERECHA */}
      <div className="topbar-right">

        {/* ✉️ NUEVAS TESINAS */}
        <div 
          className="topbar-icon"
          onClick={() => navigate("/notificaciones")}
          style={{ cursor: "pointer" }}
        >
          ✉️
          {nuevas.length > 0 && (
            <span className="badge green">
              {nuevas.length}
            </span>
          )}
        </div>

        {/* 🔔 PENDIENTES */}
        <div 
          className="topbar-icon"
          onClick={() => navigate("/notificaciones")}
          style={{ cursor: "pointer" }}
        >
          🔔 
          {pendientes.length > 0 && (
            <span className="badge yellow">
              {pendientes.length}
            </span>
          )}
        </div>

        {/* 🚩 ATRASADAS */}
        <div className="topbar-icon">
          🚩 
          {alertas.length > 0 && (
            <span className="badge red">
              {alertas.length}
            </span>
          )}
        </div>

        {/* USUARIO */}
        <div
          className="user-info"
          onClick={() => setShowMenu(!showMenu)}
          ref={menuRef}
        >
          <img src={userPhoto} alt="user" className="user-avatar" />
          <span className="username">{userName}</span>

          {showMenu && (
            <div className="user-dropdown">

              <div className="dropdown-header">
                <img src={userPhoto} alt="user" className="user-avatar-large" />
                <h3>{userName}</h3>
                <p>{userCarrera}</p>
              </div>

              <div className="dropdown-buttons">
              <button 
  className="profile-btn"
  onClick={() => setVista("perfil")}
>
  Perfil
</button>
                <button className="logout-btn" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Topbar;