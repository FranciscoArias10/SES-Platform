import { useState } from 'react';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [newRole, setNewRole] = useState('Evaluador');

  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [msg, setMsg] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleAuth = async (e) => {
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

  const loadUsers = async (token) => {
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('ses_token');
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

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--g1)' }}>
        <div className="card" style={{ padding: '32px', width: '350px' }}>
          <h2 style={{ marginBottom: '8px', color: 'var(--navy)' }}>{isRegister ? 'Registro SES' : 'Iniciar Sesión SES'}</h2>
          <p style={{ color: 'var(--g4)', fontSize: '12px', marginBottom: '24px' }}>{isRegister ? 'Crea tu cuenta' : 'Ingresa tus credenciales para acceder'}</p>
          
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

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sb">
        <div className="sb-logo">
          <div className="sb-icon">S</div>
          <div>
            <div className="sb-brand">SES Platform</div>
            <div className="sb-ver">v1.0.0</div>
          </div>
        </div>

        <div className="sb-nav">
          <div className="sb-sec">Principal</div>
          <div 
            className={`sbi ${activeTab === 'dashboard' ? 'act' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <div className="sbi-text">Inicio</div>
          </div>
          <div 
            className={`sbi ${activeTab === 'evaluations' ? 'act' : ''}`}
            onClick={() => setActiveTab('evaluations')}
          >
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <div className="sbi-text">Evaluaciones</div>
            <div className="sb-badge">3</div>
          </div>
          {user.rol === 'Admin' && (
            <div 
              className={`sbi ${activeTab === 'admin' ? 'act' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
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
            <button className="btn-p" onClick={() => setActiveTab('evaluations')}>+ Nueva Evaluación</button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="pc">
          <div className={`sc ${activeTab === 'dashboard' ? 'on' : ''}`}>
            <h1 className="page-title">Bienvenido a SES, {user.nombre}</h1>
            <p className="page-sub">El sistema para la adopción de soluciones de software.</p>
            
            <div className="card" style={{ padding: '24px' }}>
              <p>Las organizaciones públicas y privadas que necesitan adoptar un nuevo software actualmente siguen un proceso informal. <strong>SES</strong> te permite hacer un análisis FODA y una evaluación estructurada basada en factores y subfactores.</p>
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
                   <tr>
                     <td>PostgreSQL</td>
                     <td>Base de Datos</td>
                     <td><span className="bdg bgb">En curso</span></td>
                     <td>24 May 2026</td>
                     <td><button className="btn-s">Continuar</button></td>
                   </tr>
                   <tr>
                     <td>React</td>
                     <td>Librería UI</td>
                     <td><span className="bdg bgr">Completada</span></td>
                     <td>20 May 2026</td>
                     <td><button className="btn-s">Ver Reporte</button></td>
                   </tr>
                 </tbody>
               </table>
             </div>
          </div>

          <div className={`sc ${activeTab === 'admin' ? 'on' : ''}`}>
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
                           <td>
                             <span className={`bdg ${u.rol === 'Admin' ? 'bgp' : u.rol === 'Consultor' ? 'bgb' : 'bgg'}`}>
                               {u.rol}
                             </span>
                           </td>
                           <td>{u.activo ? 'Activo' : 'Inactivo'}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
