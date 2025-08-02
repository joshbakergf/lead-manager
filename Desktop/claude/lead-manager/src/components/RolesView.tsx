import React, { useState, useEffect } from 'react';
import { UserRole, Permission, SYSTEM_MODULES, ModulePermissions } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { roleService } from '../lib/firestore';
import { Plus, Shield, Edit2, Trash2, Users, CheckCircle, XCircle, Lock } from 'lucide-react';

interface RoleFormData {
  name: string;
  description: string;
  modulePermissions: ModulePermissions[];
}

// Default system roles
const DEFAULT_ROLES: UserRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    isSystem: true,
    modulePermissions: SYSTEM_MODULES.map(module => ({
      moduleId: module.id,
      moduleName: module.name,
      permissions: ['create', 'read', 'update', 'delete', 'publish', 'export', 'manage'] as Permission[]
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'manager',
    name: 'Sales Manager',
    description: 'Manage team and content, limited system access',
    isSystem: true,
    modulePermissions: SYSTEM_MODULES.map(module => ({
      moduleId: module.id,
      moduleName: module.name,
      permissions: module.id === 'users' || module.id === 'roles' 
        ? ['read'] as Permission[]
        : ['create', 'read', 'update', 'publish', 'export'] as Permission[]
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'agent',
    name: 'Sales Agent',
    description: 'Create and manage own content only',
    isSystem: true,
    modulePermissions: SYSTEM_MODULES.map(module => ({
      moduleId: module.id,
      moduleName: module.name,
      permissions: ['content', 'workflow', 'leads'].includes(module.id) 
        ? ['create', 'read', 'update'] as Permission[]
        : ['read'] as Permission[]
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const RolesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    modulePermissions: []
  });

  const allPermissions: Permission[] = ['create', 'read', 'update', 'delete', 'publish', 'export', 'manage'];

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      // Try loading from Firestore first
      const firestoreRoles = await roleService.getRoles();
      if (firestoreRoles && firestoreRoles.length > 0) {
        setRoles(firestoreRoles);
        // Also cache in localStorage
        localStorage.setItem('userRoles', JSON.stringify(firestoreRoles));
        return;
      }
    } catch (error) {
      console.warn('Failed to load roles from Firestore:', error);
    }

    // Fallback to localStorage
    const storedRoles = localStorage.getItem('userRoles');
    if (storedRoles) {
      const parsedRoles = JSON.parse(storedRoles);
      if (parsedRoles && parsedRoles.length > 0) {
        setRoles(parsedRoles);
        return;
      }
    }

    // If no roles found anywhere, initialize with defaults
    console.log('No roles found, initializing with defaults');
    setRoles(DEFAULT_ROLES);
    localStorage.setItem('userRoles', JSON.stringify(DEFAULT_ROLES));
    
    // Try to save defaults to Firestore as well
    try {
      for (const role of DEFAULT_ROLES) {
        await roleService.createRole(role);
      }
    } catch (error) {
      console.warn('Failed to save default roles to Firestore:', error);
    }
  };

  const canEdit = hasPermission('roles', 'update');
  const canDelete = hasPermission('roles', 'delete');
  const canCreate = hasPermission('roles', 'create');

  const handleAddRole = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      modulePermissions: SYSTEM_MODULES.map(module => ({
        moduleId: module.id,
        moduleName: module.name,
        permissions: []
      }))
    });
    setShowAddModal(true);
  };

  const handleEditRole = (role: UserRole) => {
    if (role.isSystem) {
      alert('System roles cannot be edited');
      return;
    }
    
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      modulePermissions: [...role.modulePermissions]
    });
    setShowAddModal(true);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      alert('System roles cannot be deleted');
      return;
    }

    if (confirm('Are you sure you want to delete this role? Users with this role will lose access.')) {
      const updatedRoles = roles.filter(r => r.id !== roleId);
      setRoles(updatedRoles);
      localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
    }
  };

  const handlePermissionToggle = (moduleId: string, permission: Permission) => {
    setFormData(prev => ({
      ...prev,
      modulePermissions: prev.modulePermissions.map(mp => {
        if (mp.moduleId === moduleId) {
          const hasPermission = mp.permissions.includes(permission);
          return {
            ...mp,
            permissions: hasPermission 
              ? mp.permissions.filter(p => p !== permission)
              : [...mp.permissions, permission]
          };
        }
        return mp;
      })
    }));
  };

  const handleModuleToggle = (moduleId: string, enable: boolean) => {
    setFormData(prev => ({
      ...prev,
      modulePermissions: prev.modulePermissions.map(mp => {
        if (mp.moduleId === moduleId) {
          return {
            ...mp,
            permissions: enable ? ['read'] : []
          };
        }
        return mp;
      })
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRole) {
      // Update existing role
      const updatedRoles = roles.map(r => 
        r.id === editingRole.id 
          ? {
              ...r,
              name: formData.name,
              description: formData.description,
              modulePermissions: formData.modulePermissions,
              updatedAt: new Date().toISOString()
            }
          : r
      );
      setRoles(updatedRoles);
      localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
    } else {
      // Create new role
      const newRole: UserRole = {
        id: `role-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        isSystem: false,
        modulePermissions: formData.modulePermissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updatedRoles = [...roles, newRole];
      setRoles(updatedRoles);
      localStorage.setItem('userRoles', JSON.stringify(updatedRoles));
    }

    setShowAddModal(false);
  };

  const getModulePermissionCount = (role: UserRole) => {
    return role.modulePermissions.reduce((count, mp) => count + mp.permissions.length, 0);
  };

  return (
    <div className="roles-view">
      <div className="view-header">
        <div className="header-left">
          <h2>Role Management</h2>
          <p className="subtitle">Create and manage user roles with granular permissions</p>
        </div>
        <div className="header-actions">
          {canCreate && (
            <button className="primary-button" onClick={handleAddRole}>
              <Plus size={20} />
              Add Role
            </button>
          )}
        </div>
      </div>

      <div className="roles-grid">
        {roles.map(role => (
          <div key={role.id} className="role-card">
            <div className="role-header">
              <div className="role-info">
                <div className="role-title">
                  <Shield size={20} className={role.isSystem ? 'system-role' : 'custom-role'} />
                  <span className="role-name">{role.name}</span>
                  {role.isSystem && <Lock size={14} className="system-lock" />}
                </div>
                <p className="role-description">{role.description}</p>
              </div>
              <div className="role-actions">
                {canEdit && !role.isSystem && (
                  <button 
                    className="icon-button"
                    onClick={() => handleEditRole(role)}
                    title="Edit role"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                {canDelete && !role.isSystem && (
                  <button 
                    className="icon-button danger"
                    onClick={() => handleDeleteRole(role.id)}
                    title="Delete role"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="role-stats">
              <div className="stat">
                <Users size={16} />
                <span>0 users</span> {/* TODO: Count users with this role */}
              </div>
              <div className="stat">
                <Shield size={16} />
                <span>{getModulePermissionCount(role)} permissions</span>
              </div>
            </div>

            <div className="role-modules">
              {role.modulePermissions.map(mp => (
                <div key={mp.moduleId} className="module-permissions">
                  <div className="module-name">{mp.moduleName}</div>
                  <div className="permissions-list">
                    {mp.permissions.length > 0 ? (
                      mp.permissions.map(permission => (
                        <span key={permission} className="permission-badge">
                          {permission}
                        </span>
                      ))
                    ) : (
                      <span className="no-access">No access</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="role-form">
              <div className="form-group">
                <label htmlFor="roleName">Role Name</label>
                <input
                  id="roleName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sales Manager"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="roleDescription">Description</label>
                <textarea
                  id="roleDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this role can do..."
                  rows={3}
                  required
                />
              </div>

              <div className="permissions-section">
                <h4>Module Permissions</h4>
                <p className="permissions-subtitle">Configure access levels for each module</p>
                
                <div className="permissions-table">
                  <div className="permissions-header">
                    <div className="module-column">Module</div>
                    <div className="permission-columns">
                      {allPermissions.map(permission => (
                        <div key={permission} className="permission-column">
                          {permission}
                        </div>
                      ))}
                    </div>
                  </div>

                  {formData.modulePermissions.map(mp => (
                    <div key={mp.moduleId} className="permission-row">
                      <div className="module-info">
                        <label className="module-toggle">
                          <input
                            type="checkbox"
                            checked={mp.permissions.length > 0}
                            onChange={(e) => handleModuleToggle(mp.moduleId, e.target.checked)}
                          />
                          <span className="module-name">{mp.moduleName}</span>
                        </label>
                      </div>
                      <div className="permission-checks">
                        {allPermissions.map(permission => (
                          <div key={permission} className="permission-check">
                            <label className="permission-checkbox">
                              <input
                                type="checkbox"
                                checked={mp.permissions.includes(permission)}
                                onChange={() => handlePermissionToggle(mp.moduleId, permission)}
                                disabled={mp.permissions.length === 0 && permission !== 'read'}
                              />
                              {mp.permissions.includes(permission) ? (
                                <CheckCircle size={16} className="check-icon checked" />
                              ) : (
                                <XCircle size={16} className="check-icon unchecked" />
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};