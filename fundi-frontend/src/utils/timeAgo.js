export const formatTimeAgo = (dateValue) => {
  if (!dateValue) return "Posted recently";

  const postedAt = new Date(dateValue);

  if (Number.isNaN(postedAt.getTime())) {
    return "Posted recently";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - postedAt.getTime()) / 1000));
  const intervals = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [label, value] of intervals) {
    const count = Math.floor(seconds / value);

    if (count >= 1) {
      return `Posted ${count} ${label}${count === 1 ? "" : "s"} ago`;
    }
  }

  return "Posted just now";
};
