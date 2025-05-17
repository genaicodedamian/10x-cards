/**
 * Formats a date string or null into a Polish date format (DD.MM.RRRR) or returns 'N/A'.
 * @param dateString The date string to format (ISO format expected) or null.
 * @returns Formatted date string or 'N/A' or 'Invalid date' if formatting fails.
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A'; // Zgodnie z planem, ale może lepiej 'Nigdy nie uczono' bezpośrednio w komponencie?
                               // Na razie trzymam się tego, co było w wrapperze.
  try {
    const date = new Date(dateString);
    // Sprawdzenie, czy data jest prawidłowa po parsowaniu
    if (isNaN(date.getTime())) {
      console.error("Invalid date value after parsing:", dateString);
      return 'Invalid date';
    }
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Invalid date'; // Return a specific string for errors
  }
}; 