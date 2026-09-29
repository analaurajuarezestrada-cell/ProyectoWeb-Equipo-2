import React, { useEffect, useState } from "react";
import "./Intro.css";

export default function Intro({ show, onDone }) {
  const [visible, setVisible] = useState(show);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!show) return;
    setVisible(true);

    const interval = setInterval(() => {
      setProgress(prev => (prev < 100 ? prev + 2 : 100));
    }, 60);

    const fade = setTimeout(() => {
      document.documentElement.style.setProperty("--intro-state", "fade");
    }, 3000);

    const end = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3600);

    return () => {
      clearInterval(interval);
      clearTimeout(fade);
      clearTimeout(end);
    };
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="intro__overlay">
      <div className="intro__container">

        {/* logo */}
        <div className="intro__logo">
          <div className="intro__logo-icon">DW</div>
          <div className="intro__logo-text">DocWise</div>
          <div className="intro__logo-subtitle">
            Sistema de Gestión Docente
          </div>
        </div>

        {/* titulo*/}
        <h1 className="intro__title">
          Sistema Académico Institucional
        </h1>

        <p className="intro__subtitle">
          Plataforma institucional para la gestión y seguimiento académico universitario
        </p>

        {/* progeso */}
        <div className="intro__progress">
          <div className="intro__progress-text">
            Inicializando sistema institucional
          </div>
          <div className="intro__progress-bar">
            <div
              className="intro__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* footer */}
        <div className="intro__footer">
          <div className="intro__institution">
            Universidad Tecnológica de la Selva
          </div>
          <div className="intro__department">
            Departamento de Tecnologías de la Información
          </div>
        </div>

      </div>
    </div>
  );
}
