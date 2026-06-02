import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [newRole, setNewRole] = useState('Evaluador');

  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [msg, setMsg] = useState('');

  const [dimensions, setDimensions] = useState<any[]>([]);
  const [evalStep, setEvalStep] = useState(1);
  const [evalData, setEvalData] = useState({
    nombre_software: '',
    descripcion: '',
    factoresPonderados: [] as any[],
    subfactoresCalificados: [] as any[]
  });
  const [evalResult, setEvalResult] = useState<any>(null);
  
  const [history, setHistory] = useState<any[]>([]);

  let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  if (API_URL && !API_URL.startsWith('http')) {
    API_URL = `https://${API_URL}`;
  }

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { nombre, apellido, correo, contrasena } : { correo, contrasena };
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        if (isRegister) {
          setMsg('Usuario registrado! Ahora puedes iniciar sesión.');
          setIsRegister(false);
          setContrasena('');
          setError('');
        } else {
          localStorage.setItem('ses_token', data.token);
          setUser(data.user);
          setError('');
          loadHistory(data.user.id);
          if (data.user.rol === 'Admin') loadUsers(data.token);
        }
      } else {
        setError(data.error);
        setMsg('');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      setMsg('');
    }
  };

  const loadUsers = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: any) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('ses_token') || '';
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre, apellido, correo, contrasena, rol: newRole })
      });
      if (res.ok) {
        loadUsers(token);
        setNombre(''); setApellido(''); setCorreo(''); setContrasena(''); setMsg('Usuario creado');
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (e) {
      setError('Error al crear usuario');
    }
  };

  const logout = () => {
    localStorage.removeItem('ses_token');
    setUser(null);
  };

  const loadHistory = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/evaluations/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('ses_token');
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            loadHistory(data.user.id);
            if (data.user.rol === 'Admin') loadUsers(token);
          } else if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('ses_token');
          }
        } catch (e) {
          console.error('Error restaurando sesión:', e);
        }
      }
      setIsLoadingAuth(false);
    };
    restoreSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoadingAuth) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--g1)', color: 'var(--navy)' }}>Cargando sesión...</div>;
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--g1)' }}>
        <div className="card" style={{ padding: '32px', width: '350px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <img src="/logo.png" alt="SES Logo" style={{ height: '110px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ marginBottom: '8px', color: 'var(--navy)', textAlign: 'center' }}>{isRegister ? 'Registro' : 'Iniciar Sesión'}</h2>
          <p style={{ color: 'var(--g4)', fontSize: '12px', marginBottom: '24px', textAlign: 'center' }}>{isRegister ? 'Crea tu cuenta' : 'Ingresa tus credenciales para acceder'}</p>
          
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isRegister && (
              <>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Nombre</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Apellido</label>
                  <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }} />
                </div>
              </>
            )}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Correo electrónico</label>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Contraseña</label>
              <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }} />
            </div>
            {error && <div style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</div>}
            {msg && <div style={{ color: 'var(--grn)', fontSize: '12px' }}>{msg}</div>}
            <button className="btn-p" style={{ justifyContent: 'center', marginTop: '8px' }} type="submit">{isRegister ? 'Registrarse' : 'Ingresar'}</button>
          </form>
          <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--blue)', textAlign: 'center', cursor: 'pointer' }} onClick={() => { setIsRegister(!isRegister); setError(''); setMsg(''); }}>
            {isRegister ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </div>
        </div>
      </div>
    );
  }


  const loadDimensions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dimensions`);
      if (res.ok) setDimensions(await res.json());
    } catch (e) {
      console.error(e);
    }
  };



  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setError('');
    setMsg('');
    if (tab === 'evaluations' && user) {
      loadHistory(user.id);
    }
  };

  const startNewEvaluation = () => {
    setActiveTab('new-eval');
    setEvalStep(1);
    setEvalData({ nombre_software: '', descripcion: '', factoresPonderados: [], subfactoresCalificados: [] });
    setEvalResult(null);
    loadDimensions();
  };

  const handlePonderacionChange = (id_factor: number, peso: number) => {
    const arr = [...evalData.factoresPonderados];
    const idx = arr.findIndex(f => f.id_factor === id_factor);
    if (idx >= 0) arr[idx].peso = peso;
    else arr.push({ id_factor, peso });
    setEvalData({ ...evalData, factoresPonderados: arr });
  };

  const handleCalificacionChange = (id_subfactor: number, calificacion: number) => {
    const arr = [...evalData.subfactoresCalificados];
    const idx = arr.findIndex(s => s.id_subfactor === id_subfactor);
    if (idx >= 0) arr[idx].calificacion = calificacion;
    else arr.push({ id_subfactor, calificacion });
    setEvalData({ ...evalData, subfactoresCalificados: arr });
  };

  const submitEvaluation = async () => {
    try {
      // Cálculo básico en frontend para mostrar el reporte de inmediato
      let totalPuntuacion = 0;
      evalData.subfactoresCalificados.forEach(s => totalPuntuacion += s.calificacion);
      
      const res = await fetch(`${API_URL}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...evalData, id_usuario: user.id })
      });
      if (res.ok) {
        setEvalResult({ total: totalPuntuacion, label: totalPuntuacion > 25 ? 'Recomendado' : 'Requiere Revisión' });
        setEvalStep(4);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sb">
        <div className="sb-logo">
          <img src="/logo.png" alt="SES Logo" style={{ height: '60px', objectFit: 'contain', marginLeft: '-10px' }} />
          <div>
            <div className="sb-brand">SES Platform</div>
            <div className="sb-ver">v1.0.0</div>
          </div>
        </div>

        <div className="sb-nav">
          <div className="sb-sec">Principal</div>
          <div className={`sbi ${activeTab === 'dashboard' ? 'act' : ''}`} onClick={() => handleTabChange('dashboard')}>
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <div className="sbi-text">Inicio</div>
          </div>
          <div className={`sbi ${activeTab === 'evaluations' ? 'act' : ''}`} onClick={() => handleTabChange('evaluations')}>
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <div className="sbi-text">Evaluaciones</div>
            <div className="sb-badge">{history.length}</div>
          </div>
          <div className={`sbi ${activeTab === 'new-eval' ? 'act' : ''}`} onClick={startNewEvaluation}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <div className="sbi-text">Nueva Evaluación</div>
          </div>
          {user.rol === 'Admin' && (
            <div className={`sbi ${activeTab === 'users' ? 'act' : ''}`} onClick={() => handleTabChange('users')}>
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <div className="sbi-text">Gestión Usuarios</div>
            </div>
          )}
        </div>

        <div className="sb-ft">
          <div className="sb-usr" onClick={logout}>
            <div className="ava">{user.nombre.substring(0, 1).toUpperCase()}</div>
            <div className="sbi-text">{user.nombre} (Salir)</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="ma">
        {/* TOPBAR */}
        <div className="tb">
          <div>
            <div className="tb-t">Sistema de Evaluación de Software</div>
            <div className="tb-s">Proyecto Proceso y Calidad</div>
          </div>
          <div className="tb-r">
            <button className="btn-s">Documentación</button>
            <button className="btn-p" onClick={startNewEvaluation}>+ Nueva Evaluación</button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="pc">
          <div className={`sc ${activeTab === 'dashboard' ? 'on' : ''}`}>
            <h1 className="page-title">Bienvenido a SES, {user.nombre}</h1>
            <p className="page-sub">El sistema para la adopción de soluciones de software.</p>
            <div className="card" style={{ padding: '24px' }}>
              <p>Las organizaciones públicas y privadas que necesitan adoptar un nuevo software actualmente siguen un proceso informal. <strong>SES</strong> te permite hacer un análisis FODA y una evaluación estructurada basada en factores y subfactores.</p>
              <button className="btn-p" style={{ marginTop: '16px' }} onClick={() => handleTabChange('evaluations')}>Ver mis evaluaciones</button>
            </div>
          </div>

          <div className={`sc ${activeTab === 'evaluations' ? 'on' : ''}`}>
             <h1 className="page-title">Tus Evaluaciones</h1>
             <p className="page-sub">Historial de evaluaciones en curso y finalizadas.</p>
             <div className="tbl">
               <table>
                 <thead>
                   <tr>
                     <th>Software</th>
                     <th>Categoría</th>
                     <th>Estado</th>
                     <th>Fecha</th>
                     <th>Acciones</th>
                   </tr>
                 </thead>
                 <tbody>
                   {history.length === 0 ? (
                     <tr>
                       <td colSpan={5} style={{ textAlign: 'center', color: 'var(--g4)' }}>No tienes evaluaciones guardadas.</td>
                     </tr>
                   ) : history.map(ev => (
                     <tr key={ev.id_evaluacion}>
                       <td style={{ fontWeight: 500 }}>{ev.nombre_software}</td>
                       <td>{ev.descripcion || 'Software General'}</td>
                       <td>
                         <span className={`bdg ${ev.estado === 'En Curso' ? 'bgb' : 'bgr'}`}>
                           {ev.estado}
                         </span>
                       </td>
                       <td>{new Date(ev.fecha_evaluacion).toLocaleDateString()}</td>
                       <td><button className="btn-s">Ver Reporte</button></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          <div className={`sc ${activeTab === 'users' ? 'on' : ''}`}>
             <h1 className="page-title">Gestión de Usuarios</h1>
             <p className="page-sub">Crea y administra los accesos al sistema SES.</p>
             <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
               <div className="card" style={{ padding: '24px', flex: 1 }}>
                 <h3 style={{ marginBottom: '16px' }}>Crear Nuevo Usuario</h3>
                 <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Nombre</label>
                      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Apellido</label>
                      <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Correo electrónico</label>
                      <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Contraseña Temporal</label>
                      <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Rol del Sistema</label>
                      <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }}>
                        <option value="Evaluador">Evaluador</option>
                        <option value="Consultor">Consultor</option>
                        <option value="Admin">Administrador</option>
                      </select>
                    </div>
                    {error && <div style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</div>}
                    {msg && <div style={{ color: 'var(--grn)', fontSize: '12px' }}>{msg}</div>}
                    <button className="btn-p" style={{ justifyContent: 'center', marginTop: '8px' }} type="submit">Crear Cuenta</button>
                 </form>
               </div>
               <div className="card" style={{ padding: '0', flex: 2, overflow: 'hidden' }}>
                 <div className="tbl">
                   <table style={{ margin: 0 }}>
                     <thead>
                       <tr>
                         <th>Usuario</th>
                         <th>Correo</th>
                         <th>Rol</th>
                         <th>Estado</th>
                       </tr>
                     </thead>
                     <tbody>
                       {users.map(u => (
                         <tr key={u.id_usuario}>
                           <td>{u.nombre} {u.apellido}</td>
                           <td>{u.correo}</td>
                           <td><span className={`bdg ${u.rol === 'Admin' ? 'bgp' : u.rol === 'Consultor' ? 'bgb' : 'bgg'}`}>{u.rol}</span></td>
                           <td>{u.activo ? 'Activo' : 'Inactivo'}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
          </div>

          <div className={`sc ${activeTab === 'new-eval' ? 'on' : ''}`}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <div>
                 <h1 className="page-title">Nueva Evaluación</h1>
                 <p className="page-sub">Paso {evalStep} de 4</p>
               </div>
               <div style={{ display: 'flex', gap: '8px' }}>
                 {evalStep > 1 && evalStep < 4 && <button className="btn-s" onClick={() => setEvalStep(evalStep - 1)}>Anterior</button>}
                 {evalStep < 3 && <button className="btn-p" onClick={() => setEvalStep(evalStep + 1)}>Siguiente Paso</button>}
                 {evalStep === 3 && <button className="btn-p" onClick={submitEvaluation}>Finalizar Evaluación</button>}
                 {evalStep === 4 && <button className="btn-p" onClick={() => setActiveTab('evaluations')}>Ir a Evaluaciones</button>}
               </div>
             </div>
             
             {evalStep === 1 && (
               <div className="card" style={{ padding: '24px', maxWidth: '600px' }}>
                 <h3 style={{ marginBottom: '16px' }}>Datos Generales del Software</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Nombre del Software a Evaluar</label>
                      <input type="text" value={evalData.nombre_software} onChange={(e) => setEvalData({...evalData, nombre_software: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }} placeholder="Ej. Oracle ERP Cloud" />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--g5)' }}>Descripción / Propósito</label>
                      <input type="text" value={evalData.descripcion} onChange={(e) => setEvalData({...evalData, descripcion: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--g3)', marginTop: '4px' }} placeholder="Breve descripción del sistema..." />
                    </div>
                 </div>
               </div>
             )}

             {evalStep === 2 && (
               <div className="card" style={{ padding: '24px' }}>
                 <h3 style={{ marginBottom: '8px' }}>Ponderación de Factores (GUIOS)</h3>
                 <p style={{ color: 'var(--g4)', fontSize: '12px', marginBottom: '24px' }}>Asigna el nivel de importancia (peso) del 1 al 5 para cada factor de calidad evaluado.</p>
                 {dimensions.map(dim => (
                   <div key={dim.id_dimension} style={{ marginBottom: '24px' }}>
                     <div className="rpsh">{dim.nombre}</div>
                     <div className="rpfm">
                       {dim.factores.map((fac: any) => (
                         <div key={fac.id_factor} className="rpfq" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div>
                             <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy)' }}>{fac.nombre}</div>
                             <div style={{ fontSize: '11px', color: 'var(--g4)' }}>{fac.descripcion}</div>
                           </div>
                           <select 
                             style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--g3)' }}
                             onChange={(e) => handlePonderacionChange(fac.id_factor, parseInt(e.target.value))}
                             defaultValue=""
                           >
                             <option value="" disabled>Peso</option>
                             <option value="1">1 - Muy Bajo</option>
                             <option value="2">2 - Bajo</option>
                             <option value="3">3 - Medio</option>
                             <option value="4">4 - Alto</option>
                             <option value="5">5 - Muy Alto</option>
                           </select>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {evalStep === 3 && (
               <div className="card" style={{ padding: '24px' }}>
                 <h3 style={{ marginBottom: '8px' }}>Calificación de Subfactores</h3>
                 <p style={{ color: 'var(--g4)', fontSize: '12px', marginBottom: '24px' }}>Califica del 1 al 5 el cumplimiento de cada característica técnica por parte del software.</p>
                 {dimensions.map(dim => (
                   <div key={dim.id_dimension}>
                     {dim.factores.map((fac: any) => (
                       <div key={fac.id_factor} style={{ marginBottom: '24px' }}>
                         <div className="rpsh">{dim.nombre} - {fac.nombre}</div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                           {fac.subfactores.map((sub: any) => (
                             <div key={sub.id_subfactor} className="rpfq" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div style={{ fontSize: '13px', color: 'var(--g6)' }}>{sub.descripcion}</div>
                               <select 
                                 style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--g3)' }}
                                 onChange={(e) => handleCalificacionChange(sub.id_subfactor, parseInt(e.target.value))}
                                 defaultValue=""
                               >
                                 <option value="" disabled>Nota</option>
                                 <option value="1">1 - Deficiente</option>
                                 <option value="2">2 - Regular</option>
                                 <option value="3">3 - Aceptable</option>
                                 <option value="4">4 - Bueno</option>
                                 <option value="5">5 - Excelente</option>
                               </select>
                             </div>
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>
                 ))}
               </div>
             )}

             {evalStep === 4 && evalResult && (
               <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                 <div className="rprb B">
                   <div className="rprl">Recomendación del Sistema</div>
                   <div className="rprv">{evalResult.label}</div>
                   <div className="rpj">El software {evalData.nombre_software} ha obtenido una calificación acumulada de {evalResult.total} puntos.</div>
                 </div>
                 
                 <div className="rptb">
                   <div className="rpsn">Análisis FODA</div>
                   <div className="rpsm">Puntos críticos identificados en la evaluación</div>
                   
                   <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     <div className="rpli">
                       <div className="rplb" style={{ background: 'var(--grn)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                       <div>
                         <div className="rplt">Fortalezas Identificadas</div>
                         <div className="rpls">Los subfactores obtuvieron calificaciones superiores a 4.</div>
                       </div>
                     </div>
                     <div className="rpli">
                       <div className="rplb" style={{ background: 'var(--red)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>
                       <div>
                         <div className="rplt">Debilidades (Áreas de Mejora)</div>
                         <div className="rpls">Ciertos factores tecnológicos requieren atención.</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
