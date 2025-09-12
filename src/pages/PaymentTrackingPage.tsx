import { useState } from 'react'
import PaymentStatusDashboard from '../components/invoices/PaymentStatusDashboard'
import PaymentReminderSystem from '../components/invoices/PaymentReminderSystem'
import { 
  CurrencyDollarIcon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export default function PaymentTrackingPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reminders' | 'analytics'>('dashboard')

  const tabs = [
    {
      id: 'dashboard' as const,
      name: 'Payment Status',
      icon: CurrencyDollarIcon,
      description: 'View payment status and overdue invoices'
    },
    {
      id: 'reminders' as const,
      name: 'Reminders',
      icon: BellIcon,
      description: 'Manage payment reminder rules and notifications'
    },
    {
      id: 'analytics' as const,
      name: 'Analytics',
      icon: ChartBarIcon,
      description: 'Payment performance analytics and reports'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Tracking</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Monitor payment status, manage overdue invoices, and send payment reminders
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon 
                      className={`-ml-0.5 mr-2 h-5 w-5 ${
                        activeTab === tab.id 
                          ? 'text-indigo-500 dark:text-indigo-400' 
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`} 
                    />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'dashboard' && (
              <PaymentStatusDashboard />
            )}
            
            {activeTab === 'reminders' && (
              <PaymentReminderSystem />
            )}
            
            {activeTab === 'analytics' && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="text-center py-12">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Payment Analytics Coming Soon
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Advanced payment analytics and reporting features will be available soon.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View Payment Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
