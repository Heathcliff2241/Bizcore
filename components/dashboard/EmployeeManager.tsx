'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PlusIcon } from '@heroicons/react/24/outline'

interface Theme {
  primary: string
  secondary: string
  accent?: string
  background?: string
  surface?: string
  text?: string
}

const defaultTheme: Theme = {
  primary: '#10B981',
  secondary: '#34D399',
  accent: '#6EE7B7',
  background: '#f9fafb',
  surface: '#f3f4f6',
  text: '#111827'
}

interface Employee {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  lastLogin: string | null
}

interface EmployeeManagerProps {
  subdomain?: string
  theme?: Theme
}

export function EmployeeManager({ subdomain, theme = defaultTheme }: EmployeeManagerProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    pin: '',
    role: 'cashier'
  })

  const querySuffix = subdomain ? `?subdomain=${encodeURIComponent(subdomain)}` : ''
  const employeesEndpoint = `/api/employees${querySuffix}`
  const employeeEndpoint = (id: number) => `/api/employees/${id}${querySuffix}`

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)

      const res = await fetch(employeesEndpoint)
      const data = await res.json()
      if (data.employees) {
        setEmployees(data.employees)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }, [employeesEndpoint])

  useEffect(() => {
    void fetchEmployees()
  }, [fetchEmployees])

  const resetForm = () => {
    setEditingEmployee(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      pin: '',
      role: 'cashier'
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      const url = editingEmployee ? employeeEndpoint(editingEmployee.id) : employeesEndpoint
      const method = editingEmployee ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save employee')
      }

      await fetchEmployees()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save employee:', error)
      alert(error instanceof Error ? error.message : 'Failed to save employee')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      const response = await fetch(employeeEndpoint(id), { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete employee')
      }

      await fetchEmployees()
    } catch (error) {
      console.error('Failed to delete employee:', error)
      alert('Failed to delete employee')
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      password: '',
      pin: '',
      role: employee.role
    })
    setShowModal(true)
  }

  const toggleActive = async (employee: Employee) => {
    try {
      const response = await fetch(employeeEndpoint(employee.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !employee.isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update employee status')
      }

      await fetchEmployees()
    } catch (error) {
      console.error('Failed to update employee status:', error)
      alert('Failed to update employee status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading employees...</div>
      </div>
    )
  }

  const title = subdomain ? `${subdomain} POS Employees` : 'POS Employees'
  const subtitle = subdomain
    ? `Manage the employees who can access the POS for ${subdomain}`
    : 'Manage employees who can access your Point of Sale system'

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" 
      style={{ backgroundColor: theme.background || '#f9fafb' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 
            className="text-3xl font-bold tracking-tight"
            style={{ color: theme.text || '#111827' }}
          >
            {title}
          </h1>
          <p 
            className="mt-2"
            style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}
          >
            {subtitle}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-semibold shadow-sm transition-shadow duration-200"
          style={{ 
            backgroundColor: theme.primary,
            boxShadow: `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 4px 12px ${theme.primary}40, 0 0 0 1px ${theme.primary}20`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
          }}
        >
          <PlusIcon className="w-5 h-5" />
          Add Employee
        </motion.button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden backdrop-blur-xl"
        style={{ 
          background: `linear-gradient(135deg, ${theme.primary}05, ${theme.secondary}05)`,
          borderColor: `${theme.primary}20`,
          border: '1px solid',
          boxShadow: `0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px ${theme.primary}10`
        }}
      >
        <table className="min-w-full divide-y" style={{ borderColor: `${theme.primary}10` }}>
          <thead style={{ backgroundColor: `${theme.primary}08` }}>
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>Email</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>Role</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>Last Login</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text ? `${theme.text}99` : '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}>
                  No employees yet. Add your first POS employee to get started.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr 
                  key={employee.id} 
                  className="transition-colors duration-150"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.primary}05`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{employee.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      style={{
                        backgroundColor: `${theme.primary}15`,
                        color: theme.primary
                      }}
                    >
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(employee)}
                      className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors duration-200"
                      style={{
                        backgroundColor: employee.isActive ? '#d1fae5' : '#fee2e2',
                        color: employee.isActive ? '#065f46' : '#991b1b'
                      }}
                    >
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                    style={{ color: theme.text ? `${theme.text}80` : '#6b7280' }}
                  >
                    {employee.lastLogin ? new Date(employee.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="font-semibold mr-4 transition-colors duration-200"
                      style={{ color: theme.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.secondary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme.primary
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="text-red-600 hover:text-red-900 font-semibold transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {!editingEmployee && '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingEmployee}
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={editingEmployee ? 'Leave blank to keep current' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4-6 digits, optional)</label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(event) => setFormData({ ...formData, pin: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="For quick POS login"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200"
                  style={{
                    color: theme.text || '#111827',
                    backgroundColor: `${theme.primary}10`,
                    border: `1px solid ${theme.primary}20`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.primary}15`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${theme.primary}10`
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-white rounded-xl font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: theme.primary,
                    boxShadow: `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.secondary
                    e.currentTarget.style.boxShadow = `0 2px 8px ${theme.primary}40, 0 0 0 1px ${theme.primary}20`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.primary
                    e.currentTarget.style.boxShadow = `0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}20`
                  }}
                >
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
