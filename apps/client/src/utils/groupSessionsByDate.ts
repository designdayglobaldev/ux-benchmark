export interface DateGroupedSessions<T> {
  id: string;
  title: string;
  sessions: T[];
}

export function groupSessionsByDate<T extends { createdAt?: string | Date; updatedAt?: string | Date }>(
  sessions: T[]
): DateGroupedSessions<T>[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const groups: { [key: string]: DateGroupedSessions<T> } = {
    today: { id: 'today', title: 'Today', sessions: [] },
    yesterday: { id: 'yesterday', title: 'Yesterday', sessions: [] },
    previous7Days: { id: 'previous-7-days', title: 'Previous 7 Days', sessions: [] },
    older: { id: 'older', title: 'Older', sessions: [] },
  };

  for (const session of sessions) {
    const rawDate = session.updatedAt || session.createdAt || new Date();
    const date = new Date(rawDate);
    const diffTime = today.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      groups.today.sessions.push(session);
    } else if (diffDays === 1) {
      groups.yesterday.sessions.push(session);
    } else if (diffDays > 1 && diffDays <= 7) {
      groups.previous7Days.sessions.push(session);
    } else {
      groups.older.sessions.push(session);
    }
  }

  return Object.values(groups).filter(g => g.sessions.length > 0);
}

