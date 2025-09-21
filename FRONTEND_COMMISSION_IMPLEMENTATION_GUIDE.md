# FRONTEND COMMISSION & PARTNERSHIP SYSTEM DOCUMENTATION

## 🎯 **OVERVIEW**

This documentation provides a complete guide for implementing the commission and partnership management system in your frontend application. The system allows users to view, manage, and monitor their commission rates and partnership percentages across different sports and casino games.

## 📋 **TABLE OF CONTENTS**

1. [System Architecture](#system-architecture)
2. [API Integration](#api-integration)
3. [User Interface Components](#user-interface-components)
4. [Commission Management](#commission-management)
5. [Partnership Management](#partnership-management)
6. [User Creation & Management](#user-creation--management)
7. [Reports & Analytics](#reports--analytics)
8. [Implementation Guide](#implementation-guide)
9. [Security Considerations](#security-considerations)

## 🏗️ **SYSTEM ARCHITECTURE**

### **Frontend Structure**
```
src/
├── components/
│   ├── commission/
│   │   ├── CommissionDashboard.tsx
│   │   ├── CommissionRates.tsx
│   │   ├── CommissionReports.tsx
│   │   ├── PartnershipManagement.tsx
│   │   └── CommissionAnalytics.tsx
│   └── common/
│       ├── DataTable.tsx
│       ├── Charts.tsx
│       └── FormComponents.tsx
├── services/
│   ├── commissionService.ts
│   └── apiClient.ts
├── types/
│   └── commission.ts
└── pages/
    ├── CommissionManagement.tsx
    └── PartnershipSettings.tsx
```

## 🔌 **API INTEGRATION**

### **Base API Configuration**
```typescript
// services/apiClient.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/commission`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### **Commission Service**
```typescript
// services/commissionService.ts
import apiClient from './apiClient';

export interface CommissionRates {
  panel: {
    soccer: number;
    cricket: number;
    tennis: number;
    matka: number;
    casino: number;
    internationalCasino: number;
  };
  match: {
    soccer: number;
    cricket: number;
    tennis: number;
  };
  session: {
    cricket: number;
  };
}

export interface CommissionReport {
  userId: string;
  userType: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalCommissionEarned: number;
    totalBetsFromDownline: number;
    averageCommissionRate: number;
  };
  breakdown: {
    byType: {
      panel: number;
      match: number;
      session: number;
    };
    bySport: {
      [sportType: string]: number;
    };
    byDownline: {
      [downlineUserId: string]: {
        userName: string;
        commissionEarned: number;
        betAmount: number;
      };
    };
  };
  generatedAt: string;
}

export interface CommissionTransaction {
  id: string;
  betId: string;
  userId: string;
  userType: string;
  uplineUserId: string;
  uplineUserType: string;
  betAmount: number;
  commissionAmount: number;
  commissionRate: number;
  commissionType: 'panel' | 'match' | 'session';
  sportType?: string;
  marketType?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

class CommissionService {
  // Get commission rates for a user
  async getCommissionRates(userId: string, userType: string): Promise<CommissionRates> {
    const response = await apiClient.get(`/rates/${userId}?userType=${userType}`);
    return response.data.data.commissionRates;
  }

  // Update commission rates for a user
  async updateCommissionRates(userId: string, userType: string, commissionRates: CommissionRates): Promise<void> {
    await apiClient.put(`/rates/${userId}`, {
      userType,
      commissionRates
    });
  }

  // Get commission report for a user
  async getCommissionReport(userId: string, userType: string, startDate?: string, endDate?: string): Promise<CommissionReport> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/report/${userId}?userType=${userType}&${params.toString()}`);
    return response.data.data;
  }

  // Get commission analytics for a user
  async getCommissionAnalytics(userId: string, userType: string, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/analytics/${userId}?userType=${userType}&${params.toString()}`);
    return response.data.data;
  }

  // Get commission transactions
  async getCommissionTransactions(userId?: string, userType?: string, startDate?: string, endDate?: string, limit = 100, offset = 0): Promise<CommissionTransaction[]> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userType) params.append('userType', userType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await apiClient.get(`/transactions?${params.toString()}`);
    return response.data.data;
  }

  // Process daily settlement (Admin only)
  async processDailySettlement(settlementDate?: string): Promise<any> {
    const response = await apiClient.post('/settle/daily', {
      settlementDate
    });
    return response.data.data;
  }

  // Reconcile commission settlement (Admin only)
  async reconcileCommissionSettlement(settlementDate: string): Promise<any> {
    const response = await apiClient.post('/reconcile', {
      settlementDate
    });
    return response.data.data;
  }

  // Validate commission settlement (Admin only)
  async validateCommissionSettlement(settlementDate: string): Promise<any> {
    const response = await apiClient.get(`/validate?settlementDate=${settlementDate}`);
    return response.data.data;
  }
}

export default new CommissionService();
```

## 🎨 **USER INTERFACE COMPONENTS**

### **1. Commission Dashboard**
```typescript
// components/commission/CommissionDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Select } from 'antd';
import { DollarOutlined, TrophyOutlined, TeamOutlined, BarChartOutlined } from '@ant-design/icons';
import commissionService from '../../services/commissionService';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface CommissionDashboardProps {
  userId: string;
  userType: string;
}

const CommissionDashboard: React.FC<CommissionDashboardProps> = ({ userId, userType }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [userId, userType, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await commissionService.getCommissionAnalytics(
        userId,
        userType,
        dateRange[0],
        dateRange[1]
      );
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="commission-dashboard">
      <div className="dashboard-header">
        <h2>Commission Dashboard</h2>
        <div className="dashboard-controls">
          <RangePicker
            value={[moment(dateRange[0]), moment(dateRange[1])]}
            onChange={(dates) => {
              if (dates) {
                setDateRange([
                  dates[0].format('YYYY-MM-DD'),
                  dates[1].format('YYYY-MM-DD')
                ]);
              }
            }}
          />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Commission Earned"
              value={analytics?.totalCommissionEarned || 0}
              prefix={<DollarOutlined />}
              precision={2}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Bets from Downline"
              value={analytics?.totalBetsFromDownline || 0}
              prefix={<TrophyOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Commission Rate"
              value={analytics?.averageCommissionRate || 0}
              suffix="%"
              prefix={<BarChartOutlined />}
              precision={2}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Downline Users"
              value={Object.keys(analytics?.downlineCommission || {}).length}
              prefix={<TeamOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Commission by Type">
            <div className="commission-breakdown">
              <div className="commission-item">
                <span>Panel Commission:</span>
                <span>₹{analytics?.commissionByType?.panel || 0}</span>
              </div>
              <div className="commission-item">
                <span>Match Commission:</span>
                <span>₹{analytics?.commissionByType?.match || 0}</span>
              </div>
              <div className="commission-item">
                <span>Session Commission:</span>
                <span>₹{analytics?.commissionByType?.session || 0}</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Commission by Sport">
            <div className="commission-breakdown">
              {Object.entries(analytics?.commissionBySport || {}).map(([sport, amount]) => (
                <div key={sport} className="commission-item">
                  <span>{sport}:</span>
                  <span>₹{amount}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CommissionDashboard;
```

### **2. Commission Rates Management**
```typescript
// components/commission/CommissionRates.tsx
import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Button, message, Row, Col, Divider } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import commissionService from '../../services/commissionService';

interface CommissionRatesProps {
  userId: string;
  userType: string;
  canEdit?: boolean;
}

const CommissionRates: React.FC<CommissionRatesProps> = ({ userId, userType, canEdit = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCommissionRates();
  }, [userId, userType]);

  const loadCommissionRates = async () => {
    setLoading(true);
    try {
      const rates = await commissionService.getCommissionRates(userId, userType);
      form.setFieldsValue(rates);
    } catch (error) {
      message.error('Failed to load commission rates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      await commissionService.updateCommissionRates(userId, userType, values);
      message.success('Commission rates updated successfully');
    } catch (error) {
      message.error('Failed to update commission rates');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Commission Rates"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={loadCommissionRates}
          loading={loading}
        >
          Refresh
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        disabled={!canEdit}
      >
        {/* Panel Commission */}
        <Card size="small" title="Panel Commission" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Soccer"
                name={['panel', 'soccer']}
                rules={[{ required: true, message: 'Please enter soccer commission rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Cricket"
                name={['panel', 'cricket']}
                rules={[{ required: true, message: 'Please enter cricket commission rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Tennis"
                name={['panel', 'tennis']}
                rules={[{ required: true, message: 'Please enter tennis commission rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Matka"
                name={['panel', 'matka']}
                rules={[{ required: true, message: 'Please enter matka commission rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Casino"
                name={['panel', 'casino']}
                rules={[{ required: true, message: 'Please enter casino commission rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="International Casino"
                name={['panel', 'internationalCasino']}
                rules={[{ required: true, message: 'Please enter international casino commission rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Match Commission */}
        <Card size="small" title="Match Commission" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Soccer Match"
                name={['match', 'soccer']}
                rules={[{ required: true, message: 'Please enter soccer match commission rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Cricket Match"
                name={['match', 'cricket']}
                rules={[{ required: true, message: 'Please enter cricket match commission rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Tennis Match"
                name={['match', 'tennis']}
                rules={[{ required: true, message: 'Please enter tennis match commission rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Session Commission */}
        <Card size="small" title="Session Commission" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Cricket Session"
                name={['session', 'cricket']}
                rules={[{ required: true, message: 'Please enter cricket session commission rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {canEdit && (
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              size="large"
            >
              Save Commission Rates
            </Button>
          </Form.Item>
        )}
      </Form>
    </Card>
  );
};

export default CommissionRates;
```

### **3. Commission Reports**
```typescript
// components/commission/CommissionReports.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, message, Row, Col, Statistic } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import commissionService from '../../services/commissionService';

const { RangePicker } = DatePicker;

interface CommissionReportsProps {
  userId: string;
  userType: string;
}

const CommissionReports: React.FC<CommissionReportsProps> = ({ userId, userType }) => {
  const [report, setReport] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  ]);

  useEffect(() => {
    loadReport();
    loadTransactions();
  }, [userId, userType, dateRange]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await commissionService.getCommissionReport(
        userId,
        userType,
        dateRange[0],
        dateRange[1]
      );
      setReport(data);
    } catch (error) {
      message.error('Failed to load commission report');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await commissionService.getCommissionTransactions(
        userId,
        userType,
        dateRange[0],
        dateRange[1]
      );
      setTransactions(data);
    } catch (error) {
      message.error('Failed to load commission transactions');
    }
  };

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Bet ID',
      dataIndex: 'betId',
      key: 'betId',
    },
    {
      title: 'Commission Type',
      dataIndex: 'commissionType',
      key: 'commissionType',
      render: (type: string) => type.charAt(0).toUpperCase() + type.slice(1),
    },
    {
      title: 'Sport Type',
      dataIndex: 'sportType',
      key: 'sportType',
    },
    {
      title: 'Bet Amount',
      dataIndex: 'betAmount',
      key: 'betAmount',
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Commission Rate',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: (rate: number) => `${rate}%`,
    },
    {
      title: 'Commission Amount',
      dataIndex: 'commissionAmount',
      key: 'commissionAmount',
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
  ];

  return (
    <div className="commission-reports">
      <Card
        title="Commission Reports"
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <RangePicker
              value={[moment(dateRange[0]), moment(dateRange[1])]}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([
                    dates[0].format('YYYY-MM-DD'),
                    dates[1].format('YYYY-MM-DD')
                  ]);
                }
              }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadReport}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                // Export functionality
                message.info('Export functionality coming soon');
              }}
            >
              Export
            </Button>
          </div>
        }
      >
        {report && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Total Commission Earned"
                value={report.summary.totalCommissionEarned}
                prefix="₹"
                precision={2}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Total Bets from Downline"
                value={report.summary.totalBetsFromDownline}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Average Commission Rate"
                value={report.summary.averageCommissionRate}
                suffix="%"
                precision={2}
              />
            </Col>
          </Row>
        )}

        <Table
          columns={transactionColumns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );
};

export default CommissionReports;
```

## 👥 **USER CREATION & MANAGEMENT**

### **User Hierarchy & Permissions**

The system supports a 9-tier user hierarchy with specific permissions and commission management for each level:

```
Developer (Level 9) - System Level
    ↓
TechAdmin (Level 8) - Can create: Admin, MiniAdmin, SuperMaster, Master, SuperAgent, Agent, Client
    ↓
Admin (Level 7) - Can create: MiniAdmin, SuperMaster, Master, SuperAgent, Agent, Client
    ↓
MiniAdmin (Level 6) - Can create: SuperMaster, Master, SuperAgent, Agent, Client
    ↓
SuperMaster (Level 5) - Can create: Master, SuperAgent, Agent, Client
    ↓
Master (Level 4) - Can create: SuperAgent, Agent, Client
    ↓
SuperAgent (Level 3) - Can create: Agent, Client
    ↓
Agent (Level 2) - Can create: Client
    ↓
Client (Level 1) - Cannot create users
```

### **1. User Creation Component**

```typescript
// components/users/UserCreation.tsx
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, InputNumber, Button, message, Row, Col, Divider, Switch } from 'antd';
import { UserAddOutlined, SaveOutlined } from '@ant-design/icons';
import userService from '../../services/userService';
import commissionService from '../../services/commissionService';

const { Option } = Select;

interface UserCreationProps {
  currentUserId: string;
  currentUserType: string;
  currentUserRole: string;
}

interface UserPermissions {
  canCreateUsers: boolean;
  canEditCommission: boolean;
  canViewReports: boolean;
  canSettleBets: boolean;
  canManageSettings: boolean;
}

interface CommissionSettings {
  panel: {
    soccer: number;
    cricket: number;
    tennis: number;
    matka: number;
    casino: number;
    internationalCasino: number;
  };
  match: {
    soccer: number;
    cricket: number;
    tennis: number;
  };
  session: {
    cricket: number;
  };
}

const UserCreation: React.FC<UserCreationProps> = ({ 
  currentUserId, 
  currentUserType, 
  currentUserRole 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableUserTypes, setAvailableUserTypes] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions>({
    canCreateUsers: false,
    canEditCommission: false,
    canViewReports: false,
    canSettleBets: false,
    canManageSettings: false
  });

  useEffect(() => {
    loadUserPermissions();
    loadAvailableUserTypes();
  }, [currentUserRole]);

  const loadUserPermissions = () => {
    const rolePermissions: { [key: string]: UserPermissions } = {
      developer: {
        canCreateUsers: true,
        canEditCommission: true,
        canViewReports: true,
        canSettleBets: true,
        canManageSettings: true
      },
      techAdmin: {
        canCreateUsers: true,
        canEditCommission: true,
        canViewReports: true,
        canSettleBets: true,
        canManageSettings: true
      },
      admin: {
        canCreateUsers: true,
        canEditCommission: true,
        canViewReports: true,
        canSettleBets: true,
        canManageSettings: false
      },
      miniAdmin: {
        canCreateUsers: true,
        canEditCommission: true,
        canViewReports: true,
        canSettleBets: true,
        canManageSettings: false
      },
      superMaster: {
        canCreateUsers: true,
        canEditCommission: true,
        canViewReports: true,
        canSettleBets: false,
        canManageSettings: false
      },
      master: {
        canCreateUsers: true,
        canEditCommission: true,
        canViewReports: true,
        canSettleBets: false,
        canManageSettings: false
      },
      superAgent: {
        canCreateUsers: true,
        canEditCommission: false,
        canViewReports: true,
        canSettleBets: false,
        canManageSettings: false
      },
      agent: {
        canCreateUsers: true,
        canEditCommission: false,
        canViewReports: false,
        canSettleBets: false,
        canManageSettings: false
      },
      client: {
        canCreateUsers: false,
        canEditCommission: false,
        canViewReports: false,
        canSettleBets: false,
        canManageSettings: false
      }
    };

    setPermissions(rolePermissions[currentUserRole] || rolePermissions.client);
  };

  const loadAvailableUserTypes = () => {
    const userTypeHierarchy: { [key: string]: string[] } = {
      developer: ['techAdmin', 'admin', 'miniAdmin', 'superMaster', 'master', 'superAgent', 'agent', 'client'],
      techAdmin: ['admin', 'miniAdmin', 'superMaster', 'master', 'superAgent', 'agent', 'client'],
      admin: ['miniAdmin', 'superMaster', 'master', 'superAgent', 'agent', 'client'],
      miniAdmin: ['superMaster', 'master', 'superAgent', 'agent', 'client'],
      superMaster: ['master', 'superAgent', 'agent', 'client'],
      master: ['superAgent', 'agent', 'client'],
      superAgent: ['agent', 'client'],
      agent: ['client'],
      client: []
    };

    setAvailableUserTypes(userTypeHierarchy[currentUserRole] || []);
  };

  const getDefaultCommissionRates = (userType: string): CommissionSettings => {
    const defaultRates: { [key: string]: CommissionSettings } = {
      techAdmin: {
        panel: { soccer: 1.5, cricket: 1.5, tennis: 1.5, matka: 1.5, casino: 1.5, internationalCasino: 1.5 },
        match: { soccer: 1.0, cricket: 1.2, tennis: 1.0 },
        session: { cricket: 0.8 }
      },
      admin: {
        panel: { soccer: 1.0, cricket: 1.0, tennis: 1.0, matka: 1.0, casino: 1.0, internationalCasino: 1.0 },
        match: { soccer: 0.8, cricket: 1.0, tennis: 0.8 },
        session: { cricket: 0.6 }
      },
      miniAdmin: {
        panel: { soccer: 0.5, cricket: 0.5, tennis: 0.5, matka: 0.5, casino: 0.5, internationalCasino: 0.5 },
        match: { soccer: 0.5, cricket: 0.6, tennis: 0.5 },
        session: { cricket: 0.4 }
      },
      superMaster: {
        panel: { soccer: 0.5, cricket: 0.5, tennis: 0.5, matka: 0.5, casino: 0.5, internationalCasino: 0.5 },
        match: { soccer: 0.5, cricket: 0.6, tennis: 0.5 },
        session: { cricket: 0.4 }
      },
      master: {
        panel: { soccer: 1.0, cricket: 1.0, tennis: 1.0, matka: 1.0, casino: 1.0, internationalCasino: 1.0 },
        match: { soccer: 0.8, cricket: 1.0, tennis: 0.8 },
        session: { cricket: 0.6 }
      },
      superAgent: {
        panel: { soccer: 1.0, cricket: 1.0, tennis: 1.0, matka: 1.0, casino: 1.0, internationalCasino: 1.0 },
        match: { soccer: 0.8, cricket: 1.0, tennis: 0.8 },
        session: { cricket: 0.6 }
      },
      agent: {
        panel: { soccer: 2.0, cricket: 2.0, tennis: 2.0, matka: 2.0, casino: 2.0, internationalCasino: 2.0 },
        match: { soccer: 1.5, cricket: 1.8, tennis: 1.5 },
        session: { cricket: 1.2 }
      },
      client: {
        panel: { soccer: 0, cricket: 0, tennis: 0, matka: 0, casino: 0, internationalCasino: 0 },
        match: { soccer: 0, cricket: 0, tennis: 0 },
        session: { cricket: 0 }
      }
    };

    return defaultRates[userType] || defaultRates.client;
  };

  const handleUserTypeChange = (userType: string) => {
    const defaultRates = getDefaultCommissionRates(userType);
    form.setFieldsValue({
      commissionRates: defaultRates
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Create user
      const userData = {
        ...values,
        uplineId: currentUserId,
        uplineType: currentUserType,
        createdBy: currentUserId,
        createdByType: currentUserType
      };

      const newUser = await userService.createUser(userData);
      
      // Set commission rates
      if (values.commissionRates) {
        await commissionService.updateCommissionRates(
          newUser.id, 
          values.userType, 
          values.commissionRates
        );
      }

      message.success('User created successfully');
      form.resetFields();
    } catch (error) {
      message.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canCreateUsers) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h3>Access Denied</h3>
          <p>You don't have permission to create users.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Create New User"
      extra={<UserAddOutlined />}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          isActive: true,
          commissionLena: true,
          commissionDena: false,
          percentageWiseCommission: true,
          partnerShipWiseCommission: false
        }}
      >
        {/* Basic Information */}
        <Card size="small" title="Basic Information" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="User Type"
                name="userType"
                rules={[{ required: true, message: 'Please select user type' }]}
              >
                <Select placeholder="Select user type" onChange={handleUserTypeChange}>
                  {availableUserTypes.map(type => (
                    <Option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Login ID"
                name="loginId"
                rules={[{ required: true, message: 'Please enter login ID' }]}
              >
                <Input placeholder="Enter login ID" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Password"
                name="user_password"
                rules={[{ required: true, message: 'Please enter password' }]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Transaction Password"
                name="transactionPassword"
                rules={[{ required: true, message: 'Please enter transaction password' }]}
              >
                <Input.Password placeholder="Enter transaction password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mobile"
                name="mobile"
                rules={[{ required: true, message: 'Please enter mobile number' }]}
              >
                <Input placeholder="Enter mobile number" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Account Settings */}
        <Card size="small" title="Account Settings" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Initial Balance"
                name="balance"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="Enter initial balance"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Credit Reference"
                name="creditRef"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="Enter credit reference"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Is Active"
                name="isActive"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Commission Settings */}
        {permissions.canEditCommission && (
          <Card size="small" title="Commission Settings" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Commission Lena"
                  name="commissionLena"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Commission Dena"
                  name="commissionDena"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Percentage Wise"
                  name="percentageWiseCommission"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Partnership Wise"
                  name="partnerShipWiseCommission"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            {/* Panel Commission */}
            <Divider>Panel Commission</Divider>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Soccer"
                  name={['commissionRates', 'panel', 'soccer']}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Cricket"
                  name={['commissionRates', 'panel', 'cricket']}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Tennis"
                  name={['commissionRates', 'panel', 'tennis']}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Matka"
                  name={['commissionRates', 'panel', 'matka']}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Casino"
                  name={['commissionRates', 'panel', 'casino']}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="International Casino"
                  name={['commissionRates', 'panel', 'internationalCasino']}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Match Commission */}
            <Divider>Match Commission</Divider>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Soccer Match"
                  name={['commissionRates', 'match', 'soccer']}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Cricket Match"
                  name={['commissionRates', 'match', 'cricket']}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Tennis Match"
                  name={['commissionRates', 'match', 'tennis']}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Session Commission */}
            <Divider>Session Commission</Divider>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Cricket Session"
                  name={['commissionRates', 'session', 'cricket']}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    suffix="%"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
            size="large"
          >
            Create User
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserCreation;
```

### **2. User Management Service**

```typescript
// services/userService.ts
import apiClient from './apiClient';

export interface UserData {
  userType: string;
  loginId: string;
  user_password: string;
  transactionPassword: string;
  name: string;
  mobile: string;
  balance?: number;
  creditRef?: number;
  isActive?: boolean;
  uplineId: string;
  uplineType: string;
  createdBy: string;
  createdByType: string;
  commissionLena?: boolean;
  commissionDena?: boolean;
  percentageWiseCommission?: boolean;
  partnerShipWiseCommission?: boolean;
}

class UserService {
  // Create a new user
  async createUser(userData: UserData): Promise<any> {
    const response = await apiClient.post('/users', userData);
    return response.data.data;
  }

  // Get users by upline
  async getUsersByUpline(uplineId: string, userType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('uplineId', uplineId);
    if (userType) params.append('userType', userType);
    
    const response = await apiClient.get(`/users?${params.toString()}`);
    return response.data.data;
  }

  // Get user details
  async getUserDetails(userId: string, userType: string): Promise<any> {
    const response = await apiClient.get(`/users/${userId}?userType=${userType}`);
    return response.data.data;
  }

  // Update user
  async updateUser(userId: string, userType: string, userData: Partial<UserData>): Promise<any> {
    const response = await apiClient.put(`/users/${userId}?userType=${userType}`, userData);
    return response.data.data;
  }

  // Delete user
  async deleteUser(userId: string, userType: string): Promise<void> {
    await apiClient.delete(`/users/${userId}?userType=${userType}`);
  }

  // Get user hierarchy
  async getUserHierarchy(userId: string, userType: string): Promise<any[]> {
    const response = await apiClient.get(`/users/${userId}/hierarchy?userType=${userType}`);
    return response.data.data;
  }
}

export default new UserService();
```

### **3. User Management Dashboard**

```typescript
// components/users/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Tag, Space, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import userService from '../../services/userService';
import UserCreation from './UserCreation';

interface UserManagementProps {
  currentUserId: string;
  currentUserType: string;
  currentUserRole: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  currentUserId, 
  currentUserType, 
  currentUserRole 
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, [currentUserId]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsersByUpline(currentUserId);
      setUsers(data);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userType: string) => {
    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user?',
      onOk: async () => {
        try {
          await userService.deleteUser(userId, userType);
          message.success('User deleted successfully');
          loadUsers();
        } catch (error) {
          message.error('Failed to delete user');
        }
      }
    });
  };

  const getUserTypeColor = (userType: string) => {
    const colors: { [key: string]: string } = {
      techAdmin: 'red',
      admin: 'orange',
      miniAdmin: 'purple',
      superMaster: 'blue',
      master: 'green',
      superAgent: 'cyan',
      agent: 'lime',
      client: 'default'
    };
    return colors[userType] || 'default';
  };

  const columns = [
    {
      title: 'Login ID',
      dataIndex: 'loginId',
      key: 'loginId',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'User Type',
      dataIndex: 'userType',
      key: 'userType',
      render: (userType: string) => (
        <Tag color={getUserTypeColor(userType)}>
          {userType.charAt(0).toUpperCase() + userType.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => `₹${balance?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setSelectedUser(record)}
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            type="primary"
          >
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteUser(record.id, record.userType)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-management">
      <Card
        title="User Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            Create User
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title="Create New User"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={800}
      >
        <UserCreation
          currentUserId={currentUserId}
          currentUserType={currentUserType}
          currentUserRole={currentUserRole}
        />
      </Modal>

      <Modal
        title="User Details"
        open={!!selectedUser}
        onCancel={() => setSelectedUser(null)}
        footer={null}
      >
        {selectedUser && (
          <div>
            <p><strong>Login ID:</strong> {selectedUser.loginId}</p>
            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>User Type:</strong> {selectedUser.userType}</p>
            <p><strong>Mobile:</strong> {selectedUser.mobile}</p>
            <p><strong>Balance:</strong> ₹{selectedUser.balance?.toFixed(2) || '0.00'}</p>
            <p><strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}</p>
            <p><strong>Created At:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
```

### **4. Default Commission Rates by User Type**

Based on your BlueBet documentation, here are the recommended default commission rates for each user type:

#### **TechAdmin (Level 8)**
```typescript
{
  panel: { 
    soccer: 1.5, cricket: 1.5, tennis: 1.5, 
    matka: 1.5, casino: 1.5, internationalCasino: 1.5 
  },
  match: { soccer: 1.0, cricket: 1.2, tennis: 1.0 },
  session: { cricket: 0.8 }
}
```

#### **Admin (Level 7)**
```typescript
{
  panel: { 
    soccer: 1.0, cricket: 1.0, tennis: 1.0, 
    matka: 1.0, casino: 1.0, internationalCasino: 1.0 
  },
  match: { soccer: 0.8, cricket: 1.0, tennis: 0.8 },
  session: { cricket: 0.6 }
}
```

#### **MiniAdmin (Level 6)**
```typescript
{
  panel: { 
    soccer: 0.5, cricket: 0.5, tennis: 0.5, 
    matka: 0.5, casino: 0.5, internationalCasino: 0.5 
  },
  match: { soccer: 0.5, cricket: 0.6, tennis: 0.5 },
  session: { cricket: 0.4 }
}
```

#### **SuperMaster (Level 5)**
```typescript
{
  panel: { 
    soccer: 0.5, cricket: 0.5, tennis: 0.5, 
    matka: 0.5, casino: 0.5, internationalCasino: 0.5 
  },
  match: { soccer: 0.5, cricket: 0.6, tennis: 0.5 },
  session: { cricket: 0.4 }
}
```

#### **Master (Level 4)**
```typescript
{
  panel: { 
    soccer: 1.0, cricket: 1.0, tennis: 1.0, 
    matka: 1.0, casino: 1.0, internationalCasino: 1.0 
  },
  match: { soccer: 0.8, cricket: 1.0, tennis: 0.8 },
  session: { cricket: 0.6 }
}
```

#### **SuperAgent (Level 3)**
```typescript
{
  panel: { 
    soccer: 1.0, cricket: 1.0, tennis: 1.0, 
    matka: 1.0, casino: 1.0, internationalCasino: 1.0 
  },
  match: { soccer: 0.8, cricket: 1.0, tennis: 0.8 },
  session: { cricket: 0.6 }
}
```

#### **Agent (Level 2)**
```typescript
{
  panel: { 
    soccer: 2.0, cricket: 2.0, tennis: 2.0, 
    matka: 2.0, casino: 2.0, internationalCasino: 2.0 
  },
  match: { soccer: 1.5, cricket: 1.8, tennis: 1.5 },
  session: { cricket: 1.2 }
}
```

#### **Client (Level 1)**
```typescript
{
  panel: { 
    soccer: 0, cricket: 0, tennis: 0, 
    matka: 0, casino: 0, internationalCasino: 0 
  },
  match: { soccer: 0, cricket: 0, tennis: 0 },
  session: { cricket: 0 }
}
```

### **5. User Creation Workflow**

#### **Step-by-Step Process:**

1. **User Selection**: Choose user type based on current user's permissions
2. **Basic Information**: Fill in login ID, password, name, mobile
3. **Account Settings**: Set initial balance, credit reference, active status
4. **Commission Settings**: Configure commission rates (if user has permission)
5. **Validation**: Validate all inputs and commission rates
6. **Creation**: Create user and set commission rates
7. **Confirmation**: Show success message and refresh user list

#### **Permission Matrix:**

| User Type | Can Create | Can Edit Commission | Can View Reports | Can Settle Bets | Can Manage Settings |
|-----------|------------|-------------------|------------------|-----------------|-------------------|
| Developer | All Types | ✅ | ✅ | ✅ | ✅ |
| TechAdmin | Admin+ | ✅ | ✅ | ✅ | ✅ |
| Admin | MiniAdmin+ | ✅ | ✅ | ✅ | ❌ |
| MiniAdmin | SuperMaster+ | ✅ | ✅ | ✅ | ❌ |
| SuperMaster | Master+ | ✅ | ✅ | ❌ | ❌ |
| Master | SuperAgent+ | ✅ | ✅ | ❌ | ❌ |
| SuperAgent | Agent+ | ✅ | ✅ | ❌ | ❌ |
| Agent | Client | ❌ | ❌ | ❌ | ❌ |
| Client | None | ❌ | ❌ | ❌ | ❌ |

### **6. Commission Rate Validation Rules**

```typescript
// Validation rules for commission rates
const validateCommissionRates = (rates: CommissionSettings, userType: string) => {
  const errors: string[] = [];
  
  // Check percentage limits
  Object.values(rates.panel).forEach(rate => {
    if (rate < 0 || rate > 100) {
      errors.push('Panel commission rates must be between 0-100%');
    }
  });
  
  // Check total commission doesn't exceed 100%
  const totalPanel = Object.values(rates.panel).reduce((sum, rate) => sum + rate, 0);
  if (totalPanel > 100) {
    errors.push('Total panel commission cannot exceed 100%');
  }
  
  // Check hierarchy rules
  const hierarchyLimits: { [key: string]: number } = {
    techAdmin: 1.5,
    admin: 1.0,
    miniAdmin: 0.5,
    superMaster: 0.5,
    master: 1.0,
    superAgent: 1.0,
    agent: 2.0,
    client: 0
  };
  
  const maxRate = hierarchyLimits[userType] || 0;
  Object.values(rates.panel).forEach(rate => {
    if (rate > maxRate) {
      errors.push(`${userType} commission rate cannot exceed ${maxRate}%`);
    }
  });
  
  return errors;
};
```

## 🔧 **IMPLEMENTATION GUIDE**

### **Step 1: Install Dependencies**
```bash
npm install antd @ant-design/icons axios moment
# or
yarn add antd @ant-design/icons axios moment
```

### **Step 2: Create Main Commission Page**
```typescript
// pages/CommissionManagement.tsx
import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import CommissionDashboard from '../components/commission/CommissionDashboard';
import CommissionRates from '../components/commission/CommissionRates';
import CommissionReports from '../components/commission/CommissionReports';

const { TabPane } = Tabs;

interface CommissionManagementProps {
  userId: string;
  userType: string;
  userRole: string;
}

const CommissionManagement: React.FC<CommissionManagementProps> = ({ 
  userId, 
  userType, 
  userRole 
}) => {
  const canEditRates = ['admin', 'techAdmin', 'developer'].includes(userRole);

  return (
    <div className="commission-management">
      <Card title="Commission Management">
        <Tabs defaultActiveKey="dashboard">
          <TabPane tab="Dashboard" key="dashboard">
            <CommissionDashboard userId={userId} userType={userType} />
          </TabPane>
          <TabPane tab="Commission Rates" key="rates">
            <CommissionRates 
              userId={userId} 
              userType={userType} 
              canEdit={canEditRates}
            />
          </TabPane>
          <TabPane tab="Reports" key="reports">
            <CommissionReports userId={userId} userType={userType} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default CommissionManagement;
```

### **Step 3: Add to Navigation**
```typescript
// Add to your main navigation component
const menuItems = [
  // ... other menu items
  {
    key: 'commission',
    label: 'Commission Management',
    icon: <DollarOutlined />,
    children: [
      {
        key: 'commission-dashboard',
        label: 'Dashboard',
      },
      {
        key: 'commission-rates',
        label: 'Commission Rates',
      },
      {
        key: 'commission-reports',
        label: 'Reports',
      },
    ],
  },
];
```

## 🔐 **SECURITY CONSIDERATIONS**

### **1. Authentication & Authorization**
```typescript
// Add role-based access control
const hasPermission = (requiredRole: string, userRole: string) => {
  const roleHierarchy = {
    developer: 9,
    techAdmin: 8,
    admin: 7,
    miniAdmin: 6,
    superMaster: 5,
    master: 4,
    superAgent: 3,
    agent: 2,
    client: 1
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
```

### **2. Input Validation**
```typescript
// Validate commission rates
const validateCommissionRates = (rates: CommissionRates) => {
  const errors: string[] = [];
  
  // Check percentage limits
  Object.values(rates.panel).forEach(rate => {
    if (rate < 0 || rate > 100) {
      errors.push('Panel commission rates must be between 0-100%');
    }
  });
  
  // Check total commission
  const totalPanel = Object.values(rates.panel).reduce((sum, rate) => sum + rate, 0);
  if (totalPanel > 100) {
    errors.push('Total panel commission cannot exceed 100%');
  }
  
  return errors;
};
```

## 📱 **RESPONSIVE DESIGN**

### **CSS Styles**
```css
/* styles/commission.css */
.commission-dashboard {
  padding: 24px;
}

.commission-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.commission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.commission-item:last-child {
  border-bottom: none;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 768px) {
  .commission-dashboard {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .dashboard-controls {
    width: 100%;
    justify-content: flex-start;
  }
}
```

## 🚀 **DEPLOYMENT CHECKLIST**

### **Before Going Live:**
- [ ] Test all API endpoints
- [ ] Validate commission calculations
- [ ] Test responsive design on mobile
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Test with different user roles
- [ ] Validate input forms
- [ ] Test date range functionality
- [ ] Implement export functionality
- [ ] Add audit logging

### **Environment Variables:**
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_COMMISSION_ENABLED=true
REACT_APP_MAX_COMMISSION_RATE=100
```

## 📊 **TESTING GUIDE**

### **Unit Tests:**
```typescript
// tests/commissionService.test.ts
import commissionService from '../services/commissionService';

describe('CommissionService', () => {
  test('should get commission rates', async () => {
    const rates = await commissionService.getCommissionRates('user123', 'agent');
    expect(rates).toHaveProperty('panel');
    expect(rates).toHaveProperty('match');
    expect(rates).toHaveProperty('session');
  });
  
  test('should validate commission rates', () => {
    const validRates = {
      panel: { soccer: 2, cricket: 2, tennis: 2, matka: 2, casino: 2, internationalCasino: 2 },
      match: { soccer: 1.5, cricket: 1.5, tennis: 1.5 },
      session: { cricket: 1 }
    };
    
    const errors = validateCommissionRates(validRates);
    expect(errors).toHaveLength(0);
  });
});
```

This documentation provides a complete guide for implementing the commission and partnership system in your frontend. The system is designed to be user-friendly, secure, and scalable.
