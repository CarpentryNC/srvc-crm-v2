import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useJobs } from '../../hooks/useJobs';
import { useCustomers } from '../../hooks/useCustomers';
import type { JobWithCustomer } from '../../types/job';

interface JobSchedulerProps {
  onJobClick?: (job: JobWithCustomer) => void;
  onScheduleJob?: () => void;
  className?: string;
}

type ViewType = 'month' | 'week' | 'day';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  job: JobWithCustomer;
  isOverdue: boolean;
}

export default function JobScheduler({ 
  onJobClick, 
  onScheduleJob,
  className = ''
}: JobSchedulerProps) {
  const { jobs, loading } = useJobs();
  const { customers } = useCustomers();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Filter jobs with scheduled dates
  const scheduledJobs = useMemo(() => {
    return jobs.filter(job => job.scheduled_date);
  }, [jobs]);

  // Convert jobs to calendar events
  const calendarEvents = useMemo((): CalendarEvent[] => {
    return scheduledJobs.map(job => {
      const startDate = new Date(job.scheduled_date!);
      const endDate = new Date(startDate);
      
      // Add estimated hours to get end time, default to 2 hours if not specified
      const durationHours = job.estimated_hours || 2;
      endDate.setHours(endDate.getHours() + durationHours);

      const isOverdue = job.status !== 'completed' && job.status !== 'cancelled' && startDate < new Date();

      return {
        id: job.id,
        title: job.title,
        start: startDate,
        end: endDate,
        job,
        isOverdue
      };
    });
  }, [scheduledJobs]);

  // Get events for current view
  const getEventsForView = () => {
    const start = getViewStart();
    const end = getViewEnd();
    
    return calendarEvents.filter(event => 
      event.start >= start && event.start <= end
    );
  };

  const getViewStart = () => {
    const date = new Date(currentDate);
    
    switch (view) {
      case 'month':
        date.setDate(1);
        date.setDate(date.getDate() - date.getDay()); // Start from Sunday
        break;
      case 'week':
        date.setDate(date.getDate() - date.getDay()); // Start from Sunday
        break;
      case 'day':
        break;
    }
    
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getViewEnd = () => {
    const date = new Date(currentDate);
    
    switch (view) {
      case 'month':
        date.setMonth(date.getMonth() + 1, 1);
        date.setDate(date.getDate() - date.getDay() + 6); // End on Saturday
        break;
      case 'week':
        date.setDate(date.getDate() - date.getDay() + 6); // End on Saturday
        break;
      case 'day':
        break;
    }
    
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getViewTitle = () => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      ...(view === 'day' && { day: 'numeric' })
    });
    
    if (view === 'week') {
      const start = getViewStart();
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    
    return formatter.format(currentDate);
  };

  const getDaysInView = () => {
    const days: Date[] = [];
    const start = getViewStart();
    const daysCount = view === 'month' ? 42 : view === 'week' ? 7 : 1;
    
    for (let i = 0; i < daysCount; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return calendarEvents.filter(event => 
      event.start >= dayStart && event.start <= dayEnd
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusColor = (job: JobWithCustomer) => {
    switch (job.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="flex space-x-2">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(42)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2" />
            Job Scheduler
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {scheduledJobs.length} jobs scheduled • {calendarEvents.filter(e => e.isOverdue).length} overdue
          </p>
        </div>
        
        {onScheduleJob && (
          <button
            onClick={onScheduleJob}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Schedule Job
          </button>
        )}
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('prev')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-0">
            {getViewTitle()}
          </h2>
          
          <button
            onClick={() => navigate('next')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Today
          </button>
        </div>

        {/* View Selector */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['month', 'week', 'day'] as ViewType[]).map((viewType) => (
            <button
              key={viewType}
              onClick={() => setView(viewType)}
              className={`px-3 py-1.5 text-sm rounded capitalize transition-colors ${
                view === viewType
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {viewType}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'month' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-3 text-sm font-medium text-gray-500 dark:text-gray-400 text-center">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {getDaysInView().map((date) => {
              const dayEvents = getEventsForDay(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              
              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-24 p-2 border-r border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !isCurrentMonthDay ? 'bg-gray-50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600' : ''
                  } ${isTodayDate ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isTodayDate ? 'text-blue-600 dark:text-blue-400' : 
                    isCurrentMonthDay ? 'text-gray-900 dark:text-gray-100' : ''
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onJobClick?.(event.job);
                        }}
                        className={`text-xs p-1 rounded border cursor-pointer hover:opacity-75 transition-opacity ${
                          getStatusColor(event.job)
                        } ${event.isOverdue ? 'ring-1 ring-red-500' : ''}`}
                        title={`${event.title} - ${formatTime(event.start)}`}
                      >
                        <div className="truncate font-medium">{event.title}</div>
                        <div className="truncate opacity-75">{formatTime(event.start)}</div>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {getDaysInView().map((date) => (
              <div key={date.toISOString()} className="p-4 text-center">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-xl font-semibold mt-1 ${
                  isToday(date) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>
          
          {/* Week events */}
          <div className="grid grid-cols-7 min-h-96">
            {getDaysInView().map((date) => {
              const dayEvents = getEventsForDay(date).sort((a, b) => a.start.getTime() - b.start.getTime());
              
              return (
                <div
                  key={date.toISOString()}
                  className="p-3 border-r border-gray-200 dark:border-gray-700 space-y-2"
                >
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onJobClick?.(event.job)}
                      className={`p-2 rounded border cursor-pointer hover:opacity-75 transition-opacity ${
                        getStatusColor(event.job)
                      } ${event.isOverdue ? 'ring-1 ring-red-500' : ''}`}
                    >
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs opacity-75">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </div>
                      <div className="text-xs opacity-75 flex items-center mt-1">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {event.job.customer.first_name} {event.job.customer.last_name}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
            </div>
            
            <div className="space-y-3">
              {getEventsForDay(currentDate).length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No jobs scheduled for this day</p>
                  {onScheduleJob && (
                    <button
                      onClick={onScheduleJob}
                      className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Schedule a Job
                    </button>
                  )}
                </div>
              ) : (
                getEventsForDay(currentDate)
                  .sort((a, b) => a.start.getTime() - b.start.getTime())
                  .map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onJobClick?.(event.job)}
                      className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                        getStatusColor(event.job)
                      } ${event.isOverdue ? 'ring-2 ring-red-500' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <ClockIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </span>
                            {event.isOverdue && (
                              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                                OVERDUE
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-base mb-1">{event.title}</h4>
                          <div className="flex items-center text-sm opacity-75 mb-2">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {event.job.customer.first_name} {event.job.customer.last_name}
                            {event.job.customer.company_name && (
                              <span className="ml-2">• {event.job.customer.company_name}</span>
                            )}
                          </div>
                          {event.job.description && (
                            <p className="text-sm opacity-75 line-clamp-2">
                              {event.job.description}
                            </p>
                          )}
                        </div>
                        <button className="ml-4 p-2 hover:bg-black/5 rounded-lg transition-colors">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {scheduledJobs.filter(j => j.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending Jobs</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">
            {scheduledJobs.filter(j => j.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600">
            {calendarEvents.filter(e => e.isOverdue).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">
            {scheduledJobs.filter(j => {
              const today = new Date();
              const jobDate = new Date(j.scheduled_date!);
              return jobDate.toDateString() === today.toDateString();
            }).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Today</div>
        </div>
      </div>
    </div>
  );
}
