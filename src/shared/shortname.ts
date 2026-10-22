export const buildShortName = (meetingName: string): { shortName: string; acronym: string } => {
  const cleaned = meetingName
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(Boolean);
  const acronym = words.map((w) => w[0]).join('').slice(0, 6) || 'MEET';

  let shortName = words.slice(0, 3).join(' ');
  if (!shortName) {
    shortName = acronym;
  }

  if (shortName.length > 16) {
    shortName = shortName.slice(0, 16).trim();
  }

  shortName = shortName.replace(/\s+/g, '_');

  return { shortName, acronym };
};
