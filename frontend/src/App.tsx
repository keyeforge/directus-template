import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthGuard from '@/components/AuthGuard'
import PermissionGuard, { AdminRoute } from '@/components/PermissionGuard'
import AdminLayout from '@/layouts/AdminLayout'
import AccountsPage from '@/pages/Accounts'
import DepartmentsPage from '@/pages/Departments'
import ContactsPage from '@/pages/Contacts'
import OpportunitiesPage from '@/pages/Opportunities'
import QuoteDetailPage from '@/pages/Quotes/Detail'
import QuotesPage from '@/pages/Quotes'
import CustomerDetailPage from '@/pages/Customers/Detail'
import CustomersPage from '@/pages/Customers'
import DashboardPage from '@/pages/Dashboard'
import LoginPage from '@/pages/Login'
import PoliciesPage from '@/pages/Policies'
import PolicyPermissionsPage from '@/pages/Policies/Permissions'
import ProductsPage from '@/pages/Products'
import RolesPage from '@/pages/Roles'
import WelcomePage from '@/pages/Welcome'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/products"
              element={
                <PermissionGuard collection="products" action="read">
                  <ProductsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/customers"
              element={
                <PermissionGuard collection="customers" action="read">
                  <CustomersPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <PermissionGuard collection="customers" action="read">
                  <CustomerDetailPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/contacts"
              element={
                <PermissionGuard collection="contacts" action="read">
                  <ContactsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/opportunities"
              element={
                <PermissionGuard collection="opportunities" action="read">
                  <OpportunitiesPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/quotes"
              element={
                <PermissionGuard collection="quotes" action="read">
                  <QuotesPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/quotes/:id"
              element={
                <PermissionGuard collection="quotes" action="read">
                  <QuoteDetailPage />
                </PermissionGuard>
              }
            />
            <Route
              path="/departments"
              element={
                <AdminRoute>
                  <DepartmentsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <AdminRoute>
                  <AccountsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <AdminRoute>
                  <RolesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/policies"
              element={
                <AdminRoute>
                  <PoliciesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/policies/:policyId/permissions"
              element={
                <AdminRoute>
                  <PolicyPermissionsPage />
                </AdminRoute>
              }
            />
            <Route path="/welcome" element={<WelcomePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
