export const useLoveDays = (startDate) => {
  const today = new Date();
  const start = new Date(startDate);

  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

  return diff;
};