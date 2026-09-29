import { useState, useEffect } from "react";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import Inicio from "./pages/Inicio";
import Documentacion from "./pages/Documentacion";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Asesorias from "./pages/Asesorias";
import Actividades from "./pages/Actividades";
import Tesinas from "./pages/Tesinas";
import Manuales from "./pages/Manuales";
import Correcciones from "./pages/Correcciones";
import Calendario from "./pages/Calendario";
import NotificacionesDocente from "./pages/NotificacionesDocente";
import NotificacionesAlumno from "./pages/NotificacionesAlumno";
import GestionDocente from "./pages/GestionDocente";
import Administrador from "./pages/Administrador";
import Perfil from "./pages/Perfil";
import TrabajoClase from "./pages/TrabajoClase";
import "./App.css";



function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [authView, setAuthView] = useState("login");
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [vista, setVista] = useState("inicio");
  const [, setArchivoParaCorreccion] = useState(null);


  useEffect(() => {
  if (sidebarHidden) {
    document.body.classList.add("sidebar-collapsed");
  } else {
    document.body.classList.remove("sidebar-collapsed");
  }
}, [sidebarHidden]);


  return (
    <>
      {/* LOGIN / REGISTRO */}
      {!isLogged && authView === "login" && (
        <Login
          onLoginSuccess={() => setIsLogged(true)}
          goToRegister={() => setAuthView("registro")}
        />
      )}

      {!isLogged && authView === "registro" && (
        <Registro goToLogin={() => setAuthView("login")} />
      )}

      {/* 🟢 APP NORMAL */}
      {isLogged && (
        <>
          <Topbar 
  toggleSidebar={() => setSidebarHidden(!sidebarHidden)} 
  setVista={setVista}
/>

          <Sidebar hidden={sidebarHidden} cambiarVista={setVista} />

          <main className={`content ${sidebarHidden ? "full" : ""}`}>
            {vista === "inicio" && <Inicio />}
            

            {vista === "documentacion" && (
              <Documentacion
                setVista={setVista}
                setArchivoParaCorreccion={setArchivoParaCorreccion}
              />
            )}

           

            {vista === "asesorias" && <Asesorias />}
            {vista === "actividades" && <Actividades />}
            {vista === "tesinas" && <Tesinas />}
            {vista === "manuales" && <Manuales />}
            {vista === "correcciones" && <Correcciones />}
            {vista === "calendario" && <Calendario />}
            {vista === "notificacionesalumno" && <NotificacionesAlumno />}
            {vista === "notificacionesdocente" && <NotificacionesDocente />}
            {vista === "gestiondocente" && <GestionDocente />}
            {vista === "administrador" && <Administrador />}
            {vista === "trabajoclase" && <TrabajoClase />}
            {vista === "perfil" && <Perfil />}

          </main>
        </>
      )}
    </>
  );
}

export default App;
