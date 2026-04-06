import { useQuery } from '@tanstack/react-query';
import { listSlots } from '../api/client';

export function useSlots(
  eventTypeId: string,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ['slots', eventTypeId, startDate, endDate],
    queryFn: () => listSlots({ eventTypeId, startDate, endDate }),
    enabled: !!eventTypeId && !!startDate && !!endDate,
    placeholderData: (previousData) => previousData,
  });
}
