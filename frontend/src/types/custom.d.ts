// Custom type declarations

declare module '*.json' {
  const value: any;
  export default value;
}


declare module 'react-big-calendar' {
  import { ComponentType, ReactNode } from 'react';

  export type View = 'month' | 'week' | 'day' | 'agenda';

  export interface CalendarProps<TEvent> {
    localizer: any;
    events?: TEvent[];
    startAccessor?: string | ((event: TEvent) => Date);
    endAccessor?: string | ((event: TEvent) => Date);
    view?: View;
    onView?: (view: View) => void;
    date?: Date;
    onNavigate?: (date: Date) => void;
    eventPropGetter?: (event: TEvent) => { style?: React.CSSProperties };
    onSelectEvent?: (event: TEvent) => void;
    messages?: Record<string, string | ((total: number) => string)>;
    culture?: string;
    formats?: Record<string, any>;
    popup?: boolean;
    selectable?: boolean;
    components?: Record<string, ComponentType<any>>;
    style?: React.CSSProperties;
    className?: string;
  }

  export const Calendar: ComponentType<CalendarProps<any>>;

  export function dateFnsLocalizer(config: {
    format: any;
    parse: any;
    startOfWeek: any;
    getDay: any;
    locales: Record<string, any>;
  }): any;
}
