import Calendar from '../components/calendar/Calendar'
import CalendarDebug from '../components/debug/CalendarDebug'

export default function CalendarPage() {
  return (
    <div className="p-6 space-y-6">
      <CalendarDebug />
      <Calendar />
    </div>
  )
}
