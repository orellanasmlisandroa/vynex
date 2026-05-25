import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../core/AuthContext';
import { useApi } from '../process/useApi';
import { CardEditor } from './CardEditor';
import { CardAnalytics } from './CardAnalytics';
import { OnboardingWizard } from './OnboardingWizard';

export const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { request } = useApi();

  const [activeTab, setActiveTab] = useState('tasks');
  const [tasksList, setTasksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para controlar el asistente de onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchUserData = async () => {
    try {
      setError('');
      const res = await request('/user/tasks');
      if (res.success) {
        setTasksList(res.tasks);
      }
      
      // Consultar analíticas para verificar si el usuario tiene una tarjeta digital creada
      const analyticsRes = await request('/card/analytics');
      if (analyticsRes.success) {
        if (!analyticsRes.hasCard) {
          setShowOnboarding(true);
        }
      }
    } catch (err) {
      setError('Error al recuperar tus tareas. Asegúrate de iniciar el backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleToggleTask = async (taskId, currentCompleted) => {
    try {
      const res = await request('/user/tasks/status', {
        method: 'POST',
        body: JSON.stringify({ taskId, completed: !currentCompleted })
      });
      if (res.success) {
        // Actualizar estado localmente
        setTasksList(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
      }
    } catch (err) {
      alert(`Error al actualizar la tarea: ${err.message}`);
    }
  };

  // Calcular progreso del checklist
  const totalTasks = tasksList.length;
  const completedTasks = tasksList.filter(t => t.completed).length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2 className="gradient-text">Cargando tus tareas en VYNEX...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar de Usuario */}
      <aside className="sidebar">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '1.8rem', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>VYNEX</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Módulo User Active</p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="glass-panel" style={{ padding: '1rem', border: 'none', background: 'hsla(222, 28%, 6%, 0.4)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Usuario activo:</p>
            <h4 style={{ margin: '0.25rem 0', color: 'var(--secondary)' }}>{user.username}</h4>
            <span className="badge badge-user">{user.role}</span>
          </div>

          {/* MENÚ DE PESTAÑAS (Navigation Links) */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button 
              onClick={() => setActiveTab('tasks')} 
              className="btn" 
              style={{ 
                justifyContent: 'flex-start',
                background: activeTab === 'tasks' ? 'var(--border-glass)' : 'transparent',
                borderColor: activeTab === 'tasks' ? 'var(--text-muted)' : 'transparent',
                fontSize: '0.85rem',
                padding: '0.65rem 1rem'
              }}
            >
              📋 Tareas y Checklist
            </button>
            <button 
              onClick={() => setActiveTab('customize')} 
              className="btn" 
              style={{ 
                justifyContent: 'flex-start',
                background: activeTab === 'customize' ? 'var(--border-glass)' : 'transparent',
                borderColor: activeTab === 'customize' ? 'var(--text-muted)' : 'transparent',
                fontSize: '0.85rem',
                padding: '0.65rem 1rem'
              }}
            >
              👤 Personalizar Card
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className="btn" 
              style={{ 
                justifyContent: 'flex-start',
                background: activeTab === 'analytics' ? 'var(--border-glass)' : 'transparent',
                borderColor: activeTab === 'analytics' ? 'var(--text-muted)' : 'transparent',
                fontSize: '0.85rem',
                padding: '0.65rem 1rem'
              }}
            >
              📊 Leads y Analíticas
            </button>
            <button 
              onClick={() => setShowOnboarding(true)} 
              className="btn" 
              style={{ 
                justifyContent: 'flex-start',
                background: 'rgba(124, 58, 237, 0.08)',
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
                fontSize: '0.85rem',
                padding: '0.65rem 1rem'
              }}
            >
              ✨ Asistente (Onboarding)
            </button>
          </nav>
        </div>

        <div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%' }}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        {activeTab === 'tasks' && (
          <>
            <header>
              <h2 className="gradient-text" style={{ fontSize: '2.2rem' }}>Mis Tareas y Seguimiento</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Checklist operativo personal y estado de avance en el proyecto.</p>
            </header>

            {error && (
              <div className="glass-panel" style={{ padding: '1rem', marginTop: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
                <p style={{ color: 'var(--danger)' }}>{error}</p>
              </div>
            )}

            {/* Panel de Progreso */}
            <section className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>📈 Progreso General</h3>
                <span className="gradient-text" style={{ fontWeight: '800', fontSize: '1.5rem' }}>{progressPct}% Completado</span>
              </div>
              
              {/* Barra de progreso visual */}
              <div style={{ width: '100%', height: '12px', background: 'hsla(222, 28%, 20%, 0.5)', borderRadius: '6px', overflow: 'hidden' }}>
                <div 
                  className="gradient-bg" 
                  style={{ width: `${progressPct}%`, height: '100%', borderRadius: '6px', transition: 'width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)' }}
                ></div>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                Tienes <strong>{completedTasks}</strong> de <strong>{totalTasks}</strong> tareas completadas satisfactoriamente.
              </p>
            </section>

            {/* Lista de Tareas Interactivas */}
            <section style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
              <h3 style={{ marginBottom: '1.25rem' }}>📋 Mi Checklist Operacional</h3>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                {tasksList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No tienes tareas asignadas por el momento.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tasksList.map((t) => (
                      <div 
                        key={t.id} 
                        onClick={() => handleToggleTask(t.id, t.completed)}
                        className="glass-panel" 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '1.1rem 1.5rem', 
                          cursor: 'pointer',
                          background: t.completed ? 'hsla(145, 80%, 45%, 0.05)' : 'hsla(222, 28%, 6%, 0.3)',
                          borderColor: t.completed ? 'hsla(145, 80%, 45%, 0.3)' : 'var(--border-glass)'
                        }}
                      >
                        {/* Checkbox emulado */}
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: '2px solid',
                          borderColor: t.completed ? 'var(--success)' : 'var(--text-muted)',
                          backgroundColor: t.completed ? 'var(--success)' : 'transparent',
                          marginRight: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}>
                          {t.completed && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</span>}
                        </div>

                        <span style={{ 
                          fontSize: '1rem', 
                          color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: t.completed ? 'line-through' : 'none',
                          fontWeight: t.completed ? 'normal' : '600',
                          transition: 'all 0.2s ease'
                        }}>
                          {t.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'customize' && <CardEditor />}
        
        {activeTab === 'analytics' && <CardAnalytics />}
      </main>

      {/* Asistente de Onboarding para nuevos usuarios */}
      <OnboardingWizard
        user={user}
        isOpen={showOnboarding}
        request={request}
        onComplete={() => {
          setShowOnboarding(false);
          fetchUserData();
        }}
      />
    </div>
  );
};
