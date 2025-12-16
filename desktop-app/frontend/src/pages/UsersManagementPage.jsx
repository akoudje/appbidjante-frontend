// src/pages/UsersManagementPage.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import {
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

export default function UsersManagementPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
  });

  // New user form
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    phone: "",
    role: "user",
    password: "",
    confirmPassword: "",
  });

  // Edit user form
  const [editUser, setEditUser] = useState({
    username: "",
    email: "",
    phone: "",
    role: "user",
  });

  const API_BASE = "http://localhost:4000/api";

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!Array.isArray(data)) {
        toast.error("Format des données invalide");
        return;
      }

      setUsers(data);
      
      // Calculate stats
      const stats = {
        total: data.length,
        active: data.filter(u => u.status === 'active').length,
        inactive: data.filter(u => u.status === 'inactive').length,
        admins: data.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
      };
      setStats(stats);
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const deleteUser = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) return;

    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success("Utilisateur supprimé avec succès");
      fetchUsers();
    } catch (err) {
      console.error("Erreur suppression:", err);
      toast.error("Erreur lors de la suppression de l'utilisateur");
    }
  };

  const updateRole = async (id, role) => {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success("Rôle mis à jour avec succès");
      fetchUsers();
    } catch (err) {
      console.error("Erreur mise à jour rôle:", err);
      toast.error("Erreur de mise à jour du rôle");
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const res = await fetch(`${API_BASE}/users/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success(`Utilisateur ${newStatus === 'active' ? 'activé' : 'désactivé'}`);
      fetchUsers();
    } catch (err) {
      console.error("Erreur changement statut:", err);
      toast.error("Erreur lors du changement de statut");
    }
  };

const createUser = async (e) => {
  e.preventDefault();
  
  // Validation
  if (newUser.password !== newUser.confirmPassword) {
    toast.error("Les mots de passe ne correspondent pas");
    return;
  }

  if (newUser.password.length < 6) {
    toast.error("Le mot de passe doit contenir au moins 6 caractères");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, { // CHANGÉ ICI
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    
    toast.success("Utilisateur créé avec succès");
    setShowCreateModal(false);
    setNewUser({
      username: "",
      email: "",
      phone: "",
      role: "user",
      password: "",
      confirmPassword: "",
    });
    fetchUsers();
  } catch (err) {
    console.error("Erreur création utilisateur:", err);
    toast.error(err.message || "Erreur lors de la création de l'utilisateur");
  }
};

  const updateUser = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch(`${API_BASE}/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          username: editUser.username,
          email: editUser.email,
          phone: editUser.phone,
          role: editUser.role,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success("Utilisateur mis à jour avec succès");
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Erreur mise à jour utilisateur:", err);
      toast.error("Erreur lors de la mise à jour de l'utilisateur");
    }
  };

  const handleBulkAction = async (action) => {
    if (bulkSelection.length === 0) {
      toast.warning("Aucun utilisateur sélectionné");
      return;
    }

    if (action === 'delete') {
      if (!window.confirm(`Supprimer ${bulkSelection.length} utilisateur(s) ?`)) return;
      
      const promises = bulkSelection.map(id => 
        fetch(`${API_BASE}/users/${id}`, {
          method: "DELETE",
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'Content-Type': 'application/json'
          },
        })
      );

      try {
        await Promise.all(promises);
        toast.success(`${bulkSelection.length} utilisateur(s) supprimé(s)`);
        setBulkSelection([]);
        fetchUsers();
      } catch (err) {
        toast.error("Erreur lors de la suppression multiple");
      }
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);
      
      // Role filter
      const matchesRole = filterRole === "all" || user.role === filterRole;
      
      // Status filter
      const matchesStatus = filterStatus === "all" || user.status === filterStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const getRoleBadge = (role) => {
    const roles = {
      superadmin: { color: "bg-red-100 text-red-800", label: "Super Admin" },
      admin: { color: "bg-purple-100 text-purple-800", label: "Administrateur" },
      treasurer: { color: "bg-blue-100 text-blue-800", label: "Trésorier" },
      manager: { color: "bg-green-100 text-green-800", label: "Gestionnaire" },
      user: { color: "bg-gray-100 text-gray-800", label: "Utilisateur" },
    };
    
    const roleConfig = roles[role] || roles.user;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
        {roleConfig.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statuses = {
      active: { color: "bg-green-100 text-green-800", label: "Actif", icon: LockOpenIcon },
      inactive: { color: "bg-red-100 text-red-800", label: "Inactif", icon: LockClosedIcon },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "En attente", icon: ExclamationTriangleIcon },
    };
    
    const statusConfig = statuses[status] || statuses.active;
    const Icon = statusConfig.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </span>
    );
  };

  const toggleUserSelection = (id) => {
    setBulkSelection(prev =>
      prev.includes(id)
        ? prev.filter(userId => userId !== id)
        : [...prev, id]
    );
  };

  const selectAllUsers = () => {
    if (bulkSelection.length === filteredUsers.length) {
      setBulkSelection([]);
    } else {
      setBulkSelection(filteredUsers.map(user => user.id));
    }
  };

  if (currentUser.role !== "superadmin" && currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Accès refusé
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Cette page est réservée aux administrateurs
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gestion des utilisateurs
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Gérez les comptes utilisateurs et leurs permissions
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlusIcon className="w-5 h-5" />
            Nouvel utilisateur
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total utilisateurs</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              </div>
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs actifs</div>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Administrateurs</div>
              <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Inactifs</div>
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Search and Filters */}
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-gray-500" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Administrateur</option>
                  <option value="treasurer">Trésorier</option>
                  <option value="manager">Gestionnaire</option>
                  <option value="user">Utilisateur</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="pending">En attente</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {bulkSelection.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-blue-600">
                    {bulkSelection.length} sélectionné(s)
                  </span>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1 text-sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              )}

              <button
                onClick={fetchUsers}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Rafraîchir
              </button>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FunnelIcon className="w-5 h-5" />
                Filtres avancés
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date de création
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dernière connexion
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                      <option value="">Toutes</option>
                      <option value="today">Aujourd'hui</option>
                      <option value="week">Cette semaine</option>
                      <option value="month">Ce mois</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Trier par
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                      <option value="newest">Plus récent</option>
                      <option value="oldest">Plus ancien</option>
                      <option value="name">Nom</option>
                      <option value="role">Rôle</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des utilisateurs...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun utilisateur trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? "Essayez de modifier vos critères de recherche" : "Aucun utilisateur n'est inscrit"}
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterRole("all");
                setFilterStatus("all");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="p-4">
                      <input
                        type="checkbox"
                        checked={bulkSelection.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={selectAllUsers}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        Utilisateur
                        <ChevronUpDownIcon className="w-4 h-4" />
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">Contact</th>
                    <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">Rôle</th>
                    <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">Statut</th>
                    <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">Date d'inscription</th>
                    <th className="p-4 text-left font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="p-4">
                        {user.id !== currentUser.id && (
                          <input
                            type="checkbox"
                            checked={bulkSelection.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.username}
                              {user.id === currentUser.id && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                                  Vous
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                              {user.email}
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <PhoneIcon className="w-4 h-4 text-gray-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => updateRole(user.id, e.target.value)}
                          disabled={user.id === currentUser.id}
                          className={`border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            user.id === currentUser.id
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-white dark:bg-gray-700 dark:text-white'
                          }`}
                        >
                          <option value="user">Utilisateur</option>
                          <option value="manager">Gestionnaire</option>
                          <option value="treasurer">Trésorier</option>
                          <option value="admin">Administrateur</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(user.status || 'active')}
                          <button
                            onClick={() => toggleUserStatus(user.id, user.status || 'active')}
                            disabled={user.id === currentUser.id}
                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                              user.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title={user.status === 'active' ? 'Désactiver' : 'Activer'}
                          >
                            {user.status === 'active' ? (
                              <LockClosedIcon className="w-4 h-4 text-gray-500" />
                            ) : (
                              <LockOpenIcon className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <CalendarIcon className="w-4 h-4" />
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setEditUser({
                                username: user.username,
                                email: user.email || '',
                                phone: user.phone || '',
                                role: user.role,
                              });
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              // View user details
                              console.log("View user:", user);
                            }}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>

                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Affichage de {filteredUsers.length} sur {users.length} utilisateur(s)
        </div>

        {/* Create User Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Nouvel utilisateur
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={createUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom d'utilisateur *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="john_doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rôle
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="manager">Gestionnaire</option>
                      <option value="treasurer">Trésorier</option>
                      <option value="admin">Administrateur</option>
                      {currentUser.role === 'superadmin' && (
                        <option value="superadmin">Super Admin</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirmer le mot de passe *
                    </label>
                    <input
                      type="password"
                      required
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Créer l'utilisateur
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit User Modal */}
        <AnimatePresence>
          {showEditModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Modifier l'utilisateur
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={updateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      required
                      value={editUser.username}
                      onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={editUser.phone}
                      onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rôle
                    </label>
                    <select
                      value={editUser.role}
                      onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="manager">Gestionnaire</option>
                      <option value="treasurer">Trésorier</option>
                      <option value="admin">Administrateur</option>
                      {currentUser.role === 'superadmin' && (
                        <option value="superadmin">Super Admin</option>
                      )}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Mettre à jour
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                      }}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}