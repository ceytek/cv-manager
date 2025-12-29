import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_COMPANIES } from '../graphql/queries';
import CreateCompanyModal from '../components/CreateCompanyModal';
import SubscriptionPlans from '../components/SubscriptionPlans';
import './Dashboard.css';

function Dashboard() {
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const [activeTab, setActiveTab] = useState('customers');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pageSize = 10;

  const { data, loading, error, refetch } = useQuery(GET_COMPANIES, {
    variables: {
      page,
      pageSize,
      search: search || null,
      isActive: isActiveFilter
    },
    fetchPolicy: 'network-only'
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilterActive = (value) => {
    setIsActiveFilter(value);
    setPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const companies = data?.companies?.companies || [];
  const totalPages = data?.companies?.totalPages || 0;
  const total = data?.companies?.total || 0;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="company-logo">HR</div>
          <div>
            <h3>HRSMART Inc.</h3>
            <p>Management Portal</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={activeTab === 'dashboard' ? 'nav-item' : 'nav-item'} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button className={activeTab === 'customers' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('customers')}>
            <span className="nav-icon">👥</span>
            Müşteri Yönetimi
          </button>
          <button className={activeTab === 'subscriptions' ? 'nav-item' : 'nav-item'} onClick={() => setActiveTab('subscriptions')}>
            <span className="nav-icon">💎</span>
            Abonelik Paket Yönetimi
          </button>
          <button className={activeTab === 'projects' ? 'nav-item' : 'nav-item'} onClick={() => setActiveTab('projects')}>
            <span className="nav-icon">📁</span>
            Projects
          </button>
          <button className={activeTab === 'billing' ? 'nav-item' : 'nav-item'} onClick={() => setActiveTab('billing')}>
            <span className="nav-icon">💳</span>
            Billing
          </button>
          <button className={activeTab === 'analytics' ? 'nav-item' : 'nav-item'} onClick={() => setActiveTab('analytics')}>
            <span className="nav-icon">📈</span>
            Analytics
          </button>
          <button className={activeTab === 'settings' ? 'nav-item' : 'nav-item'} onClick={() => setActiveTab('settings')}>
            <span className="nav-icon">⚙️</span>
            Settings
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'subscriptions' ? (
          <SubscriptionPlans />
        ) : (
          <>
            {/* Header */}
            <header className="content-header">
              <div>
                <h1>Müşteriler</h1>
                <p>Mevcut tüm müşterileri yönetin ve görüntüleyin. Toplam: {total}</p>
              </div>
              <div className="header-actions">
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                  + Yeni Müşteri Ekle
                </button>
                <button className="btn-logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            </header>

        {/* Filters */}
        <div className="filters-bar">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Şirket adı veya kod ile ara..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-search">Ara</button>
            {search && (
              <button 
                type="button" 
                className="btn-clear"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setPage(1);
                }}
              >
                Temizle
              </button>
            )}
          </form>

          <div className="filter-buttons">
            <button 
              className={isActiveFilter === null ? 'filter-btn active' : 'filter-btn'}
              onClick={() => handleFilterActive(null)}
            >
              Tümü
            </button>
            <button 
              className={isActiveFilter === true ? 'filter-btn active' : 'filter-btn'}
              onClick={() => handleFilterActive(true)}
            >
              Aktif
            </button>
            <button 
              className={isActiveFilter === false ? 'filter-btn active' : 'filter-btn'}
              onClick={() => handleFilterActive(false)}
            >
              Pasif
            </button>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && <div className="loading-state">Yükleniyor...</div>}
        {error && <div className="error-state">Hata: {error.message}</div>}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Müşteri Kodu</th>
                    <th>Şirket Adı</th>
                    <th>Email</th>
                    <th>Telefon</th>
                    <th>Üyelik Planı</th>
                    <th>Durum</th>
                    <th>Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                        Müşteri bulunamadı
                      </td>
                    </tr>
                  ) : (
                    companies.map((company) => (
                      <tr key={company.id}>
                        <td><strong>{company.companyCode}</strong></td>
                        <td>{company.name}</td>
                        <td>{company.email || '-'}</td>
                        <td>{company.phone || '-'}</td>
                        <td>{company.subscription?.planName || 'Üyelik Yok'}</td>
                        <td>
                          <span className={`status-badge status-${company.isActive ? 'aktif' : 'pasif'}`}>
                            {company.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td>{formatDate(company.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Önceki
                </button>
                <span className="pagination-info">
                  Sayfa {page} / {totalPages}
                </span>
                <button 
                  className="pagination-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}
        </>
        )}
      </main>

      <CreateCompanyModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          refetch();
          alert('Müşteri başarıyla eklendi!');
        }}
      />
    </div>
  );
}

export default Dashboard;
