import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Products from './pages/master/Products.jsx'
import Partners from './pages/master/Partners.jsx'
import ChartOfAccounts from './pages/master/ChartOfAccounts.jsx'
import Warehouses from './pages/master/Warehouses.jsx'
import TaxRates from './pages/master/TaxRates.jsx'
import Categories from './pages/master/Categories.jsx'
import Units from './pages/master/Units.jsx'
import PurchaseOrders from './pages/purchase/PurchaseOrders.jsx'
import PurchaseOrderForm from './pages/purchase/PurchaseOrderForm.jsx'
import PurchaseOrderDetail from './pages/purchase/PurchaseOrderDetail.jsx'
import SalesOrders from './pages/sales/SalesOrders.jsx'
import SalesOrderForm from './pages/sales/SalesOrderForm.jsx'
import SalesOrderDetail from './pages/sales/SalesOrderDetail.jsx'
import Deliveries from './pages/sales/Deliveries.jsx'
import DeliveryForm from './pages/sales/DeliveryForm.jsx'
import DeliveryDetail from './pages/sales/DeliveryDetail.jsx'
import Invoices from './pages/sales/Invoices.jsx'
import InvoiceDetail from './pages/sales/InvoiceDetail.jsx'
import Receipts from './pages/sales/Receipts.jsx'
import Payments from './pages/money/Payments.jsx'
import JournalEntries from './pages/accounting/JournalEntries.jsx'
import GlEntries from './pages/accounting/GlEntries.jsx'
import TrialBalance from './pages/accounting/TrialBalance.jsx'
import SalesReport from './pages/reports/SalesReport.jsx'
import PurchaseReport from './pages/reports/PurchaseReport.jsx'
import VatReport from './pages/reports/VatReport.jsx'
import StockReport from './pages/reports/StockReport.jsx'
import StockMovementsReport from './pages/reports/StockMovementsReport.jsx'
import StockCardReport from './pages/reports/StockCardReport.jsx'
import WhtReport from './pages/reports/WhtReport.jsx'
import SettingsPage from './pages/settings/SettingsPage.jsx'
import Users from './pages/settings/Users.jsx'
import PrintDocument from './pages/print/PrintDocument.jsx'

function Protected({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="partners" element={<Partners />} />
        <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="tax-rates" element={<TaxRates />} />
        <Route path="categories" element={<Categories />} />
        <Route path="units" element={<Units />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="purchase-orders/new" element={<PurchaseOrderForm />} />
        <Route path="purchase-orders/:id" element={<PurchaseOrderDetail />} />
        <Route path="purchase-orders/:id/edit" element={<PurchaseOrderForm />} />
        <Route path="sales-orders" element={<SalesOrders />} />
        <Route path="sales-orders/new" element={<SalesOrderForm />} />
        <Route path="sales-orders/:id" element={<SalesOrderDetail />} />
        <Route path="sales-orders/:id/edit" element={<SalesOrderForm />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="deliveries/new" element={<DeliveryForm />} />
        <Route path="deliveries/:id" element={<DeliveryDetail />} />
        <Route path="deliveries/:id/edit" element={<DeliveryForm />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="payments" element={<Payments />} />
        <Route path="journal-entries" element={<JournalEntries />} />
        <Route path="gl-entries" element={<GlEntries />} />
        <Route path="trial-balance" element={<TrialBalance />} />
        <Route path="reports/sales" element={<SalesReport />} />
        <Route path="reports/purchases" element={<PurchaseReport />} />
        <Route path="reports/vat" element={<VatReport />} />
        <Route path="reports/stock" element={<StockReport />} />
        <Route path="reports/stock-movements" element={<StockMovementsReport />} />
        <Route path="reports/stock-card" element={<StockCardReport />} />
        <Route path="reports/wht" element={<WhtReport />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="users" element={<Users />} />
      </Route>
      <Route path="/print/:type/:id" element={<PrintDocument />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
