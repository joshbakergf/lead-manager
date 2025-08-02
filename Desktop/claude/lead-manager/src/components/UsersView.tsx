import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { userService, roleService } from '../lib/firestore';
import { Plus, Search, Edit2, Trash2, Shield, Mail, UserCheck, UserX } from 'lucide-react';

interface UserFormData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  roleId: string;
  isActive: boolean;
}

export const UsersView: React.FC = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    roleId: '',
    isActive: true
  });

  // Load users and roles from Firestore
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      const firestoreUsers = await userService.getAllUsers();
      setUsers(firestoreUsers);
      console.log('Loaded users from Firestore:', firestoreUsers.length);
    } catch (error) {
      console.error('Failed to load users from Firestore:', error);
      // Fallback to localStorage
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
    }
  };

  const loadRoles = async () => {
    try {
      const firestoreRoles = await roleService.getRoles();
      setRoles(firestoreRoles);
      console.log('Loaded roles from Firestore:', firestoreRoles.length);
    } catch (error) {
      console.error('Failed to load roles from Firestore:', error);
      // Fallback to localStorage
      const storedRoles = localStorage.getItem('userRoles');
      if (storedRoles) {
        setRoles(JSON.parse(storedRoles));
      }
    }
  };

  const canEdit = hasPermission('users', 'update');
  const canDelete = hasPermission('users', 'delete');
  const canCreate = hasPermission('users', 'create');

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      roleId: roles[0]?.id || '',
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      isActive: user.isActive
    });
    setShowAddModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account");
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      try {
        // Note: userService doesn't have deleteUser method, so we need to add it
        // For now, just remove from local state and localStorage as fallback
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        console.log('User deleted (local only - need to implement Firestore delete)');
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update existing user
        await userService.updateUser(editingUser.id, formData);
        console.log('User updated in Firestore');
        
        // Update local state
        const updatedUsers = users.map(u => 
          u.id === editingUser.id 
            ? {
                ...u,
                ...formData,
                updatedAt: new Date().toISOString()
              }
            : u
        );
        setUsers(updatedUsers);
      } else {
        // Create new user
        const userId = `user-${Date.now()}`;
        await userService.createUser(userId, formData);
        console.log('User created in Firestore');
        
        // Add to local state
        const newUser: User = {
          id: userId,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setUsers([...users, newUser]);
      }
      
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user. Please try again.');
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Unknown';
  };

  return (
    <div className="users-view">
      <div className="view-header">
        <div className="header-left">
          <h2>User Management</h2>
          <p className="subtitle">Manage system users and their access levels</p>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canCreate && (
            <button className="primary-button" onClick={handleAddUser}>
              <Plus size={20} />
              Add User
            </button>
          )}
        </div>
      </div>

      <div className="users-grid">
        <div className="grid-header">
          <div className="grid-cell">User</div>
          <div className="grid-cell">Email</div>
          <div className="grid-cell">Role</div>
          <div className="grid-cell">Status</div>
          <div className="grid-cell">Last Login</div>
          <div className="grid-cell">Actions</div>
        </div>
        
        {filteredUsers.map(user => (
          <div key={user.id} className="grid-row">
            <div className="grid-cell user-info">
              <div className="user-avatar">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <div className="user-name">{user.firstName} {user.lastName}</div>
                <div className="user-username">@{user.username}</div>
              </div>
            </div>
            <div className="grid-cell">
              <Mail size={16} className="cell-icon" />
              {user.email}
            </div>
            <div className="grid-cell">
              <Shield size={16} className="cell-icon" />
              {getRoleName(user.roleId)}
            </div>
            <div className="grid-cell">
              {user.isActive ? (
                <span className="status-badge active">
                  <UserCheck size={14} />
                  Active
                </span>
              ) : (
                <span className="status-badge inactive">
                  <UserX size={14} />
                  Inactive
                </span>
              )}
            </div>
            <div className="grid-cell">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
            </div>
            <div className="grid-cell actions">
              {canEdit && (
                <button 
                  className="icon-button"
                  onClick={() => handleEditUser(user)}
                  title="Edit user"
                >
                  <Edit2 size={16} />
                </button>
              )}
              {canDelete && user.id !== currentUser?.id && (
                <button 
                  className="icon-button danger"
                  onClick={() => handleDeleteUser(user.id)}
                  title="Delete user"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  required
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};