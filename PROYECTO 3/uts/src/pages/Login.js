import React, { useState, useEffect } from "react";
import "./Login.css";
import Intro from "../components/Intro";

export default function Login({ onLoginSuccess, goToRegister }) {
  const [stage, setStage] = useState("form");
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      console.log("🔍 Iniciando login con matrícula:", matricula);
      
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula, password }),
      });

      const data = await response.json();
      
      console.log("====================================");
      console.log("🔍 RESPUESTA DEL BACKEND COMPLETA:");
      console.log("✅ Status HTTP:", response.status, response.ok);
      console.log("✅ data.success:", data.success);
      console.log("✅ data.user existe?:", data.user ? "SÍ" : "NO");
      console.log("✅ Contenido de data.user:", data.user);
      console.log("✅ Estructura completa de data:", JSON.stringify(data, null, 2));
      console.log("====================================");

      if (response.ok && data.success) {
       
        console.log("💾 Intentando guardar datos del usuario...");
        
        
      
        // Guardar datos reales del usuario
// Guardar datos reales del usuario
localStorage.setItem("userId", data.user.id); // 🔥 ESTA FALTABA
localStorage.setItem("userName", data.user.nombre);
localStorage.setItem("userUsuario", data.user.usuario);
localStorage.setItem("userRole", data.user.rol);
localStorage.setItem("userCarrera", data.user.carrera);
localStorage.setItem("userCuatrimestre", data.user.cuatrimestre);

// Debug
localStorage.setItem("loginDebugData", JSON.stringify(data));

console.log("✅ ID guardado:", data.user.id);
console.log("✅ Rol guardado:", data.user.rol);

        
      
        
        // Verificar qué se guardó
        console.log("✅ Verificación final localStorage:");
        console.log("  - userName:", localStorage.getItem("userName"));
        console.log("  - token:", localStorage.getItem("token"));
        console.log("  - loginDebugData guardado");

        // Login exitoso
        setStage("intro");
      } else {
        console.log("❌ Login fallido:", data.message);
        setMessage(data.message || "❌ Matrícula o contraseña incorrectas");
      }
    } catch (error) {
      console.error("🔥 Error crítico en login:", error);
      setMessage("❌ Error de conexión con el servidor");
    }
  };

  if (stage === "form") {
    return (
      <div className="login-page">
        <div className="login-container">
          <h1 className="login-title">Bienvenido</h1>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Matrícula
              <input
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                required
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button type="submit" className="login-button">
              Iniciar sesión
            </button>
          </form>

          {message && <p className="login-message">{message}</p>}

          <div className="register-link">
            <p>
              ¿No tienes cuenta?{" "}
              <span onClick={goToRegister}>Regístrate aquí</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "intro") {
    return <Intro show onDone={() => setStage("home")} />;
  }

  if (stage === "home") {
    return <HomeNotice onFinish={onLoginSuccess} />;
  }

  return null;
}

function HomeNotice({ onFinish }) {
  useEffect(() => {
    console.log("🏠 HomeNotice - Verificando localStorage:");
    console.log("  - userName:", localStorage.getItem("userName"));
    console.log("  - userMatricula:", localStorage.getItem("userMatricula"));
    console.log("  - loginDebugData:", localStorage.getItem("loginDebugData"));
    
    const t = setTimeout(onFinish, 2000);
    return () => clearTimeout(t);
  }, [onFinish]);

 
}