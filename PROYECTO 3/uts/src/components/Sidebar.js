import "./Sidebar.css";
import { useState, useEffect, useRef } from "react";


const Sidebar = ({ hidden, cambiarVista }) => {
  
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImage] = useState("https://i.pravatar.cc/60");


  const esAlumno = userRole === "alumno";
  const esDocente = userRole === "docente" || userRole === "admin";

  const fileInputRef = useRef(null);

  // Cargar datos del usuario al iniciar
  useEffect(() => {
    const role = localStorage.getItem("userRole");
if (role) {
  setUserRole(role);
}

    // Cargar nombre del usuario
    const storedName = localStorage.getItem("userName");
    if (storedName && storedName !== "Usuario") {
      setUserName(storedName);
    } else {
      // Si no hay nombre, usar matrícula
     const userUsuario = localStorage.getItem("userUsuario");

     
if (userUsuario) {
  setUserName(userUsuario);
} else {
  setUserName("Usuario");
}

    }
    
    // 🔄 CARGAR FOTO DEL USUARIO ACTUAL
    cargarFotoUsuario();
  }, []);

  // 🔄 FUNCIÓN PARA CARGAR FOTO DEL USUARIO ACTUAL
  const cargarFotoUsuario = () => {
const userUsuario = localStorage.getItem("userUsuario");

if (userUsuario) {
  const fotoKey = `profileImage_${userUsuario}`;

      const savedImage = localStorage.getItem(fotoKey);
      
      if (savedImage) {
        setProfileImage(savedImage);
        console.log(`✅ Foto cargada para usuario: ${userUsuario}`);

      } else {
        // Si no hay foto guardada, usar la por defecto
        setProfileImage("https://i.pravatar.cc/60");
        console.log(`⚠️ No hay foto guardada para usuario: ${userUsuario}`);

      }
    }
  };

  // 🔄 FUNCIÓN PARA CAMBIAR LA FOTO DE PERFIL
  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecciona un archivo de imagen válido (JPG, PNG, etc.)");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen es demasiado grande. El tamaño máximo es 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        const userUsuario = localStorage.getItem("userUsuario");

if (!userUsuario) {
  alert("No se pudo identificar al usuario. Inicia sesión nuevamente.");
  return;
}

const fotoKey = `profileImage_${userUsuario}`;

        localStorage.setItem(fotoKey, imageUrl);
        
        // Actualizar estado
        setProfileImage(imageUrl);
        
        console.log(`✅ Foto guardada para usuario: ${userUsuario}`);

      };
      reader.readAsDataURL(file);
    }
  };

  // 🔐 FUNCIÓN PARA CERRAR SESIÓN
  const cerrarSesion = () => {
    // Limpiar datos de sesión (NO las fotos de perfil)
    localStorage.removeItem("userName");
    localStorage.removeItem("userUsuario");

    localStorage.removeItem("userRole");
    localStorage.removeItem("userCarrera");
    localStorage.removeItem("token");
    localStorage.removeItem("loginDebugData");
    
    // Redirigir al login
    window.location.href = "/login";
  };

  return (
    <aside className={`sidebar ${hidden ? "hidden" : ""}`}>

      {/* ===== USUARIO CON FOTO CLICKEABLE ===== */}
      <div className="user-panel">
        <div className="avatar-container">
          <img 
            src={profileImage} 
            alt="User" 
            className="profile-image"
            onClick={handleImageClick}
            title="Haz clic para cambiar tu foto de perfil"
          />
          <div className="whatsapp-dot"></div>
          
          {/* Input oculto para seleccionar archivo */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: "none" }}
          />
        </div>
        <div className="user-info">
          <p className="username">{userName}</p>
        </div>
      </div>

      {/* ===== BUSCADOR ===== */}
      <div className="search-container">
        <input type="text" placeholder="Buscar..." />
        <span className="search-icon">
          <i className="fas fa-search"></i>
        </span>
      </div>

      <p className="menu-header">NAVEGACIÓN PRINCIPAL</p>

      <ul className="menu">

        {/* INICIO */}
        <li className="menu-item" onClick={() => cambiarVista("inicio")}>
          <i className="fas fa-home menu-icon"></i>
          <span>Inicio</span>
        </li>

        {/* DOCUMENTACIÓN */}
     {esDocente && (
  <li className="menu-item" onClick={() => cambiarVista("documentacion")}>
    <i className="fas fa-folder-open menu-icon"></i>
    <span>Documentación</span>
  </li>
)}



      {esAlumno && (
  <li className="menu-item" onClick={() => cambiarVista("asesorias")}>
    <i className="fas fa-comments menu-icon"></i>
    <span>Asesorías</span>
  </li>
)}



    {esAlumno && (
  <li className="menu-item" onClick={() => cambiarVista("actividades")}>
    <i className="fas fa-tasks menu-icon"></i>
    <span>Actividades</span>
  </li>
)}



  {esDocente && (
  <li className="menu-item" onClick={() => cambiarVista("tesinas")}>
    <i className="fas fa-file-alt menu-icon"></i>
    <span>Tesinas</span>
  </li>
)}



   {esAlumno && (
  <li className="menu-item" onClick={() => cambiarVista("manuales")}>
    <i className="fas fa-book menu-icon"></i>
    <span>Manuales</span>
  </li>
)}


  


   {esAlumno && (
  <li className="menu-item" onClick={() => cambiarVista("calendario")}>
    <i className="fas fa-calendar-alt menu-icon"></i>
    <span>Calendario Académico</span>
  </li>
)}


     {esAlumno && (
  <li className="menu-item" onClick={() => cambiarVista("notificacionesalumno")}>
    <i className="fas fa-bell menu-icon"></i>
    <span>NotificacionesAlumno</span>
  </li>
)}


{esDocente && (
  <li className="menu-item" onClick={() => cambiarVista("notificacionesdocente")}>
    <i className="fas fa-bell menu-icon"></i>
    <span>NotificacionesDocente</span>
  </li>
)}


  {esDocente && (
  <li className="menu-item" onClick={() => cambiarVista("gestiondocente")}>
    <i className="fas fa-chalkboard-teacher menu-icon"></i>
    <span>Gestión Docente</span>
  </li>
)}



{esDocente && (
  <li className="menu-item" onClick={() => cambiarVista("administrador")}>
    <i className="fas fa-user-shield menu-icon"></i>
    <span>Admin</span>
  </li>
)}


{esDocente && (
  <li className="menu-item" onClick={() => cambiarVista("trabajoclase")}>
    <i className="fas fa-chalkboard-teacher menu-icon"></i>
    <span>Trabajo de clase</span>
  </li>
)}

     

        {/* 🔴 CERRAR SESIÓN */}
        <li className="menu-item logout" onClick={cerrarSesion}>
          <i className="fas fa-sign-out-alt menu-icon"></i>
          <span>Cerrar sesión</span>
        </li>

      </ul>
    </aside>
  );
};

export default Sidebar;