export const DANDELIOUS_LEXIKON_URL = 'https://cnctxt.ai.studio/dandeliouslexikon';

export const openHelpLexikon = () => {
  try {
    const link = document.createElement('a');
    link.href = DANDELIOUS_LEXIKON_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    window.location.href = DANDELIOUS_LEXIKON_URL;
  }
};
