import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Center, Environment, OrbitControls } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './App.css';

Chart.register(...registerables);
Chart.defaults.color = 'rgba(255,255,255,0.5)';
Chart.defaults.font.family = "'Inter', sans-serif";

function HumanModel() {
  const obj = useLoader(OBJLoader, 'human.obj');
  const modelRef = useRef();
  
  useFrame(() => { 
    if (modelRef.current && !window.crashed) {
      modelRef.current.rotation.y += 0.003; 
    }
  });
  
  return (
    <Center>
      <primitive object={obj} ref={modelRef} scale={0.2} position={[0, 0, 0]} />
    </Center>
  );
}

// --- ERWEITERTE LABORPARAMETER ---
const LAB_REF = {
  BLUTBILD: [
    { id: 'leuko', label: 'Leukozyten', unit: 'Tsd./µl', min: 4.4, max: 11.3 },
    { id: 'hb', label: 'Hämoglobin', unit: 'g/dl', min: 13.5, max: 18.0 },
    { id: 'mcv', label: 'MCV', unit: 'fl', min: 80, max: 96 },
    { id: 'trombo', label: 'Thrombozyten', unit: 'Tsd./µl', min: 150, max: 400 }
  ],
  STOFFWECHSEL: [
    { id: 'gluk', label: 'Nüchtern-Glukose', unit: 'mg/dl', min: 70, max: 99 },
    { id: 'hba1c', label: 'HbA1c', unit: '%', min: 4.0, max: 5.7 },
    { id: 'crp', label: 'CRP (Entzündung)', unit: 'mg/l', min: 0, max: 5.0 },
    { id: 'ferritin', label: 'Ferritin (Eisen)', unit: 'µg/l', min: 30, max: 400 }
  ],
  ORGANWERTE: [
    { id: 'gpt', label: 'ALAT (GPT)', unit: 'U/l', min: 0, max: 50 },
    { id: 'krea', label: 'Kreatinin', unit: 'mg/dl', min: 0.8, max: 1.2 },
    { id: 'egfr', label: 'eGFR', unit: 'ml/min', min: 90, max: 150 }
  ]
};

const generateHexDump = (length = 150) => Array.from({length}).map(() => Math.random().toString(16).substr(2, 4).toUpperCase()).join(' ');

const toHex = (val) => {
  if (typeof val === 'string' && val.includes('/')) {
    return val.split('/').map(v => '0x' + parseInt(v).toString(16).toUpperCase()).join(' / ');
  }
  const num = parseFloat(val);
  if (isNaN(num)) return '0xERR';
  return '0x' + Math.floor(num).toString(16).toUpperCase();
};

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [activeOrgan, setActiveOrgan] = useState('BLUTBILD');
  
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [systemCrashed, setSystemCrashed] = useState(false);
  
  window.crashed = systemCrashed;

  const [config, setConfig] = useState({
    patient: {
      name: "MAXIMILIAN NEUMANN",
      id: "DHT-9412-DIAGNOSTIK",
      dob: "17. APRIL 2004"
    },
    mriInfo: "JÄHRLICHES MRT-CHECKUP: ABGESCHLOSSEN",
    mri: [
      { date: "21.05.2026 - 08:14", info: "Sagittal | Keine Anomalien" },
      { date: "21.05.2026 - 08:22", info: "Axial | AVM Struktur stabil" }
    ],
    lab: {
      BLUTBILD: { leuko: "6.4", hb: "14.8", mcv: "88", trombo: "250" },
      STOFFWECHSEL: { gluk: "85", hba1c: "5.2", crp: "1.2", ferritin: "120" },
      ORGANWERTE: { gpt: "34", krea: "0.9", egfr: "98" }
    },
    smartwatch: "Letzte 7 Tage: Leichte Schlafdefizite (Ø 5.2h). Herzfrequenzvariabilität (HFV) im Normalbereich. Keine Rhythmusstörungen erkannt.",
    aiRecommendation: "Dosisreduktion des Beta-Blockers um 15% aufgrund anhaltend stabiler Blutdruckwerte empfohlen."
  });

  const mriImages = [
    "https://radiologie.med.uni-rostock.de/fileadmin/Institute/radiologie/MRT/mrt-schnittbild-kopf-animation.gif",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/001_Arteriovenous_Malformation_MRT_T2_axial.gif/250px-001_Arteriovenous_Malformation_MRT_T2_axial.gif"
  ];

  const [bpm, setBpm] = useState(72);
  const [bp, setBp] = useState("120/80");
  const [ecgData, setEcgData] = useState(Array.from({ length: 40 }, () => 70));

  useEffect(() => {
    const interval = setInterval(() => {
      if(systemCrashed) {
        setEcgData(prev => {
          const newData = [...prev];
          newData.push(0);
          newData.shift();
          return newData;
        });
        return;
      }

      const newBpm = 68 + Math.floor(Math.random() * 8);
      setBpm(newBpm);

      if (Math.random() > 0.7) {
        const sys = 117 + Math.floor(Math.random() * 6);
        const dia = 76 + Math.floor(Math.random() * 5);
        setBp(`${sys}/${dia}`);
      }

      setEcgData(prev => {
        const newData = [...prev];
        newData.push(newBpm + (Math.random() > 0.85 ? 35 : (Math.random() < 0.1 ? -15 : 0))); 
        newData.shift();
        return newData;
      });
    }, 1000); 
    return () => clearInterval(interval);
  }, [systemCrashed]);

  // --- PRESET FUNKTION ---
  const applyPreset = (presetType) => {
    let newLab = JSON.parse(JSON.stringify(config.lab)); 
    let newRec = "";
    let newWatch = "";

    if (presetType === "NORMAL") {
      newLab.BLUTBILD.hb = "14.8"; newLab.BLUTBILD.mcv = "88"; newLab.STOFFWECHSEL.ferritin = "120";
      newLab.STOFFWECHSEL.gluk = "85"; newLab.STOFFWECHSEL.hba1c = "5.2";
      newLab.BLUTBILD.leuko = "6.4"; newLab.STOFFWECHSEL.crp = "1.2";
      newRec = "Dosisreduktion des Beta-Blockers um 15% empfohlen.";
      newWatch = "Letzte 7 Tage: Leichte Schlafdefizite (Ø 5.2h). Herzfrequenzvariabilität (HFV) im Normalbereich.";
    } 
    else if (presetType === "ANAMIE") {
      newLab.BLUTBILD.hb = "9.2"; 
      newLab.BLUTBILD.mcv = "72"; 
      newLab.STOFFWECHSEL.ferritin = "15"; 
      newRec = "O₂-Versorgung kritisch reduziert. Eisen-Substitution und weitere Abklärung empfohlen.";
      newWatch = "Letzte 7 Tage: Signifikant erhöhtes Schlafbedürfnis (Ø 9.5h). Niedriges Aktivitätslevel festgestellt.";
    } 
    else if (presetType === "DIABETES") {
      newLab.STOFFWECHSEL.gluk = "155"; 
      newLab.STOFFWECHSEL.hba1c = "7.8"; 
      newRec = "Chronisch erhöhte Werte. Lifestyle-Intervention und Metformin-Evaluierung dringend empfohlen.";
      newWatch = "Kontinuierlicher Glukose-Proxy zeigt steigenden Trend. Aktivitätslevel anhaltend niedrig.";
    } 
    else if (presetType === "INFEKTION") {
      newLab.STOFFWECHSEL.crp = "45.0"; 
      newLab.BLUTBILD.leuko = "16.8"; 
      newRec = "Beginnende bakterielle Infektion wahrscheinlich → sofort Breitspektrum-Antibiotika starten.";
      newWatch = "Letzte 24h: Erhöhte Ruheherzfrequenz (Ø 92 BPM) und leicht erhöhte Körpertemperatur erkannt.";
    }

    setConfig(prev => ({
      ...prev,
      lab: newLab,
      aiRecommendation: newRec,
      smartwatch: newWatch
    }));
  };

  const handlePatientChange = (field, value) => setConfig(prev => ({ ...prev, patient: { ...prev.patient, [field]: value } }));
  const handleLabChange = (organ, id, value) => setConfig(prev => ({ ...prev, lab: { ...prev.lab, [organ]: { ...prev.lab[organ], [id]: value } } }));

  const ecgChartData = {
    labels: Array.from({ length: 40 }, (_, i) => i),
    datasets: [{ data: ecgData, borderColor: systemCrashed ? '#ff3333' : '#00ffcc', borderWidth: 2, tension: 0.4, pointRadius: 0 }]
  };

  return (
    <>
      <div className="hex-bg"></div>

      <button 
        className="secret-director-btn" 
        onClick={() => setSystemCrashed(!systemCrashed)}
        title="Regie-Trigger: Crash"
      />

      {systemCrashed && (
        <div className="realistic-crash-overlay">
          <div className="realistic-error-box">
            <div className="realistic-error-header">
              <div className="error-icon">!</div>
              <div style={{ fontWeight: 600 }}>Diagnostik Interface Application Error</div>
            </div>
            <div className="realistic-error-content">
              <p><strong>Unhandled Exception: 0x80040154 (ACCESS_VIOLATION)</strong></p>
              <p style={{ marginTop: '10px' }}>
                The AI Kernel Process (diagd.exe) terminated unexpectedly. Synchronization with the central database has been lost.
              </p>
              <p style={{ marginTop: '10px' }}>
                Please close the application and continue manual diagnosis, or contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard">
        
        {/* === LINKE SPALTE === */}
        <div className="column">
          <div className="hud-panel scanlines" style={{ height: '38%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <div className="title glow" style={{ color: systemCrashed ? 'var(--red)' : '' }}>
                {systemCrashed ? 'MEMORY DUMP [LAB]' : 'LABORPARAMETER & BIOMARKER'}
              </div>
              {!systemCrashed && <div className="pulse" style={{ width: 8, height: 8, background: '#00ff99', borderRadius: '50%', boxShadow: '0 0 10px #00ff99' }}></div>}
            </div>
            
            <div className="organ-tabs">
              {Object.keys(LAB_REF).map(organ => (
                <button key={organ} className={`organ-tab ${activeOrgan === organ ? 'active' : ''}`} onClick={() => setActiveOrgan(organ)}>
                  {organ}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
              {LAB_REF[activeOrgan].map((ref) => {
                const userString = config.lab[activeOrgan][ref.id];
                const userVal = parseFloat(userString);
                
                let isOutOfRange = false;
                let color = 'var(--cyan)';
                let displayValue = userString;

                if (systemCrashed) {
                  color = 'var(--red)';
                  displayValue = toHex(userVal);
                } else {
                  isOutOfRange = !isNaN(userVal) && (userVal < ref.min || userVal > ref.max);
                  color = isOutOfRange ? 'var(--warn)' : 'var(--cyan)';
                }

                return (
                  <div key={ref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ color: systemCrashed ? 'var(--red)' : 'rgba(255,255,255,0.8)' }}>
                        {systemCrashed ? `0x${ref.id.toUpperCase()}_MEM` : ref.label}
                      </span>
                    </div>
                    <div className="lab-val-wrapper">
                      {!systemCrashed && (
                        <div className="lab-norm-tooltip">
                          NORM: {ref.min} - {ref.max} {ref.unit}
                        </div>
                      )}
                      <span style={{ color: color, fontWeight: '600', fontFamily: "'Orbitron', sans-serif", fontSize: '1.1rem', textShadow: isOutOfRange ? '0 0 8px var(--warn)' : 'none' }}>
                        {displayValue}
                      </span>
                      {!systemCrashed && (
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', marginBottom: '2px' }}>
                          {ref.unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hud-panel scanlines" style={{ height: '30%' }}>
            <div className={`title ${systemCrashed ? '' : (isWatchConnected ? 'pink' : '')}`} style={{ color: systemCrashed ? 'var(--red)' : (!isWatchConnected ? '#666' : '') }}>
              KARDIOVASKULÄRE AKTIVITÄT
            </div>
            
            {!isWatchConnected && !systemCrashed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                 <div className="pulse" style={{ width: 10, height: 10, border: '1px solid #888', borderRadius: '50%', marginBottom: '8px' }}></div>
                 <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', color: '#888', letterSpacing: '1px' }}>WEARABLE OFFLINE</div>
              </div>
            ) : (
              <>
                <div style={{ height: '40px', margin: '5px 0' }}>
                  <Line data={ecgChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false, min: -10, max: 130 } }, plugins: { legend: { display: false } }, animation: false }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.55rem', color: '#666', marginBottom: '2px' }}>PULS (BPM)</div>
                    <div className={`metric-value ${systemCrashed ? 'crashed' : ''}`}>
                      {systemCrashed ? toHex(bpm) : bpm}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.55rem', color: '#666', marginBottom: '2px' }}>BLUTDRUCK</div>
                    <div className={`metric-value ${systemCrashed ? 'crashed' : 'pink'}`}>
                      {systemCrashed ? toHex(bp) : bp}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="hud-panel scanlines" style={{ flex: 1, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="title" style={{ color: systemCrashed ? 'var(--red)' : '#00ccff' }}>
                SMARTWATCH SYNC
              </div>
              <button 
                onClick={() => setIsWatchConnected(!isWatchConnected)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(0,255,255,0.1)', cursor: 'pointer', fontSize: '0.55rem', letterSpacing: '1px', fontFamily: "'Orbitron', sans-serif" }}
              >
                {isWatchConnected ? '[ X ]' : '[ C ]'}
              </button>
            </div>
            
            {systemCrashed ? (
               <div style={{ color: 'var(--red)', fontSize: '0.7rem', marginTop: '10px' }}>ERR: DEVICE DISCONNECTED. KERNEL PANIC.</div>
            ) : isWatchConnected ? (
              <div style={{ fontSize: '0.75rem', color: '#a5f3fc', lineHeight: '1.6', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div className="pulse-fast" style={{ width: 8, height: 8, background: '#00ccff', borderRadius: '50%', boxShadow: '0 0 10px #00ccff' }}></div>
                  <span style={{ fontWeight: 'bold', letterSpacing: '1px', color: '#00ccff' }}>GERÄT VERBUNDEN</span>
                </div>
                <div style={{ opacity: 0.8 }}>
                  {config.smartwatch}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.4 }}>
                 <div className="pulse" style={{ width: 14, height: 14, border: '2px solid #00ccff', borderRadius: '50%', marginBottom: '12px' }}></div>
                 <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.65rem', color: '#00ccff', letterSpacing: '1px' }}>WARTE AUF KOPPLUNG...</div>
              </div>
            )}
          </div>
        </div>

        {/* === MITTLERE SPALTE === */}
        <div className="hud-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          
          <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? '[ SCHLIESSEN ]' : '[ SYS_CNFG ]'}
          </button>

          {showSettings && (
            <div className="settings-modal">
              
              <div className="settings-section" style={{ background: 'rgba(0, 255, 255, 0.05)', padding: '10px', borderRadius: '6px' }}>
                <div className="settings-section-title">DREHBUCH PRESETS</div>
                <button className="preset-btn" onClick={() => applyPreset('NORMAL')}>🟢 Normal (Standard)</button>
                <button className="preset-btn" onClick={() => applyPreset('ANAMIE')}>🩸 Anämie (Eisenmangel)</button>
                <button className="preset-btn" onClick={() => applyPreset('DIABETES')}>🍬 Diabetes (Typ 2)</button>
                <button className="preset-btn" onClick={() => applyPreset('INFEKTION')}>🦠 Infektion (Bakteriell)</button>
              </div>

              <div className="settings-section" style={{ background: 'rgba(255, 0, 0, 0.05)', padding: '10px', borderRadius: '6px' }}>
                <div className="settings-section-title" style={{ color: 'var(--red)' }}>SYSTEM CONTROL</div>
                <button 
                  className="crash-trigger-btn" 
                  onClick={() => setSystemCrashed(!systemCrashed)}
                >
                  {systemCrashed ? 'CRASH BEENDEN' : 'SYSTEM CRASH AUSLÖSEN'}
                </button>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">PATIENTENSTAMM</div>
                <label>Name</label>
                <input type="text" value={config.patient.name} onChange={(e) => handlePatientChange('name', e.target.value)} />
                <label>Twin ID</label>
                <input type="text" value={config.patient.id} onChange={(e) => handlePatientChange('id', e.target.value)} />
              </div>

              <div className="settings-section">
                <div className="settings-section-title">LABOR: {activeOrgan}</div>
                {LAB_REF[activeOrgan].map((ref) => (
                  <div key={ref.id} style={{display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '4px'}}>
                    <label>{ref.label}</label>
                    <input type="number" step="0.01" value={config.lab[activeOrgan][ref.id]} onChange={(e) => handleLabChange(activeOrgan, ref.id, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ position: 'absolute', top: '25px', left: '25px', zIndex: 10, fontFamily: "'Orbitron', sans-serif", textAlign: 'left' }}>
            <div style={{ fontSize: '0.65rem', color: systemCrashed ? 'var(--red)' : 'rgba(0, 255, 255, 0.5)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>
              {systemCrashed ? 'CRITICAL SYSTEM FAILURE' : 'Patienten-Schnittstelle'}
            </div>
            <div className="title glow" style={{ fontSize: '1.7rem', letterSpacing: '3px', margin: 0, lineHeight: '1.1', color: systemCrashed ? 'var(--red)' : '' }}>
              {systemCrashed ? '0x80040154' : config.patient.name}
            </div>
            {!systemCrashed && (
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', color: 'rgba(0, 255, 255, 0.75)' }}>
                <div><span style={{ color: '#555', fontSize: '0.7rem', fontWeight: 600, marginRight: '4px' }}>ID:</span>{config.patient.id}</div>
                <div><span style={{ color: '#555', fontSize: '0.7rem', fontWeight: 600, marginRight: '4px' }}>GEB:</span>{config.patient.dob}</div>
              </div>
            )}
          </div>

          {!systemCrashed && (
            <div style={{ position: 'absolute', top: '25px', right: '25px', zIndex: 10, textAlign: 'right' }}>
              <div style={{ background: 'rgba(0, 255, 153, 0.1)', border: '1px solid var(--green)', color: 'var(--green)', padding: '6px 12px', borderRadius: '6px', fontFamily: "'Orbitron', sans-serif", fontSize: '0.6rem', letterSpacing: '1px', backdropFilter: 'blur(4px)' }}>
                {config.mriInfo}
              </div>
            </div>
          )}

          <div className="canvas-container">
            <Canvas camera={{ position: [0, 0, 6], fov: 42 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[5, 5, 5]} color={systemCrashed ? "#ff0000" : "#00ffff"} intensity={4} />
              <pointLight position={[-5, -2, 4]} color={systemCrashed ? "#550000" : "#ff00ff"} intensity={3} />
              <Suspense fallback={null}>
                <HumanModel />
                <Environment preset="city" /> 
              </Suspense>
              <OrbitControls enableZoom={false} />
            </Canvas>
          </div>

          <div style={{ position: 'absolute', bottom: '25px', left: '25px', right: '25px', zIndex: 10, display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <div style={{ background: systemCrashed ? 'rgba(255,0,0,0.1)' : 'rgba(2,6,18,0.7)', border: `1px solid ${systemCrashed ? 'var(--red)' : 'rgba(0,255,255,0.2)'}`, padding: '6px 16px', borderRadius: '6px', backdropFilter: 'blur(5px)' }}>
              <div style={{ fontSize: '0.55rem', color: systemCrashed ? 'var(--red)' : '#555', fontFamily: "'Orbitron', sans-serif" }}>STRESSLEVEL</div>
              <div className={`metric-value ${systemCrashed ? 'crashed' : 'pink'}`} style={{ fontSize: '1.1rem', marginTop: '2px' }}>
                {systemCrashed ? 'ERR' : '12%'}
              </div>
            </div>
            <div style={{ background: systemCrashed ? 'rgba(255,0,0,0.1)' : 'rgba(2,6,18,0.7)', border: `1px solid ${systemCrashed ? 'var(--red)' : 'rgba(0,255,255,0.2)'}`, padding: '6px 16px', borderRadius: '6px', backdropFilter: 'blur(5px)' }}>
              <div style={{ fontSize: '0.55rem', color: systemCrashed ? 'var(--red)' : '#555', fontFamily: "'Orbitron', sans-serif" }}>INTEGRATIONSSTATUS</div>
              <div className={`metric-value ${systemCrashed ? 'crashed' : 'green'}`} style={{ fontSize: '1.1rem', marginTop: '2px' }}>
                {systemCrashed ? 'FATAL' : 'OPTIMAL'}
              </div>
            </div>
          </div>
        </div>

        {/* === RECHTE SPALTE === */}
        <div className="column">
          
          <div className="hud-panel" style={{ height: '32%' }}>
            <div className="title" style={{ color: systemCrashed ? 'var(--red)' : '' }}>
              GANZKÖRPER-SCREENING
            </div>
            <div className="mri-grid">
              
              <div className="mri-viewer">
                {!systemCrashed && (
                  <div className="mri-info-wrapper">
                    <div className="mri-info-icon">i</div>
                    <div className="mri-info-tooltip">
                      <div className="mri-info-date">{config.mri[0].date}</div>
                      <div className="mri-info-text">{config.mri[0].info}</div>
                    </div>
                  </div>
                )}
                <div className="mri-image-container">
                  {systemCrashed ? (
                    <div className="hex-dump">{generateHexDump()}</div>
                  ) : (
                    <img src={mriImages[0]} alt="MRI 1" className="mri-image" />
                  )}
                </div>
              </div>

              <div className="mri-viewer">
                {!systemCrashed && (
                  <div className="mri-info-wrapper">
                    <div className="mri-info-icon">i</div>
                    <div className="mri-info-tooltip">
                      <div className="mri-info-date">{config.mri[1].date}</div>
                      <div className="mri-info-text">{config.mri[1].info}</div>
                    </div>
                  </div>
                )}
                <div className="mri-image-container">
                  {systemCrashed ? (
                    <div className="hex-dump">{generateHexDump()}</div>
                  ) : (
                    <img src={mriImages[1]} alt="MRI 2" className="mri-image" />
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="hud-panel" style={{ height: '23%', justifyContent: 'center' }}>
             <div className="title" style={{ textAlign: 'center', color: systemCrashed ? 'var(--red)' : 'var(--green)' }}>KI-THERAPIEPLAN</div>
             <div style={{ fontSize: '0.75rem', color: systemCrashed ? 'var(--red)' : '#a5f3fc', textAlign: 'center', marginTop: '5px' }}>
                {systemCrashed ? 'BUFFER OVERFLOW. MODEL UNRESPONSIVE.' : config.aiRecommendation}
             </div>
             <div style={{ display: 'flex', justifyContent: 'center' }}>
               {systemCrashed ? (
                 <div className="active-badge" style={{ color: 'var(--red)', borderColor: 'var(--red)', background: 'rgba(255,0,0,0.1)' }}>OFFLINE</div>
               ) : (
                 <div className="active-badge">KI-MODUS AKTIV</div>
               )}
             </div>
          </div>

          <div className="hud-panel" style={{ flex: 1 }}>
            <div className="title pink" style={{ color: systemCrashed ? 'var(--red)' : '' }}>
              DIAGNOSTISCHER PROTOKOLL-LOG
            </div>
            <div style={{ fontSize: '0.75rem', color: systemCrashed ? 'var(--red)' : '#a5f3fc', lineHeight: '1.6', opacity: 0.8, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {systemCrashed ? (
                <>
                  <div>&gt; ERR: Connection timed out.</div>
                  <div>&gt; ERR: Failed to read sensor data.</div>
                  <div>&gt; FATAL: Kernel panic at 0x80040154.</div>
                  <div>&gt; Shutting down non-essential modules...</div>
                  <div className="pulse" style={{ marginTop: '10px' }}>_</div>
                </>
              ) : (
                <>
                  <div>&gt; Initialisiere Ganzkörper-Phänotypisierung...</div>
                  {isWatchConnected && <div>&gt; <span style={{ color: 'var(--cyan)' }}>Wearable-Daten erfolgreich verarbeitet.</span></div>}
                  <div>&gt; <span style={{ color: 'var(--green)' }}>Bildgebung synchronisiert (Schnitt 41A).</span></div>
                  <div>&gt; Berechne Organfunktion-Prognose...</div>
                  <div>&gt; Labor-Abgleich abgeschlossen.</div>
                  <div style={{ marginTop: '10px', color: '#444' }}>System bereit...</div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}