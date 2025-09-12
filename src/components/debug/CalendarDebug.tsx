import { useJobs } from '../../hooks/useJobs'
import { useCalendar } from '../../hooks/useCalendar'

export function CalendarDebug() {
  const { jobs, loading: jobsLoading } = useJobs()
  const { events, loading: calendarLoading } = useCalendar()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0] // 2025-09-13

  const scheduledJobs = jobs.filter(job => job.scheduled_date)
  const tomorrowJobs = scheduledJobs.filter(job => 
    job.scheduled_date?.startsWith(tomorrowStr)
  )

  const tomorrowEvents = events.filter(event => 
    event.start_datetime.startsWith(tomorrowStr)
  )

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Calendar Debug Information</h2>
      
      {/* Date Info */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
        <h3 className="font-semibold">Date Information:</h3>
        <p>Today: {new Date().toISOString().split('T')[0]}</p>
        <p>Tomorrow: {tomorrowStr}</p>
      </div>

      {/* Jobs Data */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Jobs Data (useJobs hook)</h3>
        <p>Loading: {jobsLoading ? 'Yes' : 'No'}</p>
        <p>Total jobs: {jobs.length}</p>
        <p>Scheduled jobs: {scheduledJobs.length}</p>
        <p>Tomorrow's jobs: {tomorrowJobs.length}</p>
        
        {scheduledJobs.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">All Scheduled Jobs:</h4>
            <div className="space-y-2">
              {scheduledJobs.map(job => (
                <div key={job.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <p><strong>Title:</strong> {job.title}</p>
                  <p><strong>Scheduled:</strong> {job.scheduled_date}</p>
                  <p><strong>Status:</strong> {job.status}</p>
                  <p><strong>Customer:</strong> {job.customer.first_name} {job.customer.last_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Events Data */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Calendar Events (useCalendar hook)</h3>
        <p>Loading: {calendarLoading ? 'Yes' : 'No'}</p>
        <p>Total events: {events.length}</p>
        <p>Tomorrow's events: {tomorrowEvents.length}</p>
        
        {events.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">All Calendar Events:</h4>
            <div className="space-y-2">
              {events.map(event => (
                <div key={event.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <p><strong>Title:</strong> {event.title}</p>
                  <p><strong>Start:</strong> {event.start_datetime}</p>
                  <p><strong>Type:</strong> {event.event_type}</p>
                  <p><strong>Status:</strong> {event.status}</p>
                  <p><strong>Customer:</strong> {event.customer_name || 'Not specified'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current View Info */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
        <h4 className="font-medium mb-2">Debugging Notes:</h4>
        <ul className="text-sm space-y-1">
          <li>• Jobs hook fetches from 'jobs' table with scheduled_date filter</li>
          <li>• Calendar hook fetches from 'jobs' table and transforms to calendar events</li>
          <li>• Calendar component uses useCalendar hook for display</li>
          <li>• JobScheduler component uses useJobs hook directly</li>
          <li>• Check if the date formats match between components</li>
        </ul>
      </div>
    </div>
  )
}

export default CalendarDebug
