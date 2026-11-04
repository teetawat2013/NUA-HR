/**
 * Google Drive URL Parser & Converter Utility
 * Supports extracting file IDs and converting share links into direct preview image URLs and document viewer URLs.
 */

export const isGoogleDriveUrl = (url?: string): boolean => {
  if (!url) return false;
  return /drive\.google\.com|docs\.google\.com|googleusercontent\.com/.test(url);
};

export const getGoogleDriveFileId = (url?: string): string | null => {
  if (!url) return null;
  
  // Patterns:
  // 1. https://drive.google.com/file/d/FILE_ID/view
  // 2. https://drive.google.com/open?id=FILE_ID
  // 3. https://drive.google.com/uc?id=FILE_ID
  // 4. https://docs.google.com/document/d/FILE_ID/...
  // 5. https://lh3.googleusercontent.com/d/FILE_ID
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Returns a direct image URL for Google Drive files that can be rendered in an <img> tag.
 * Uses Google User Content thumbnail endpoint which does not require authentication for public/shared files.
 */
export const getGoogleDriveImageUrl = (url?: string, width: number = 800): string => {
  if (!url) return '';
  
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return url;

  // lh3.googleusercontent.com/d/ or drive.google.com/thumbnail are the most reliable direct image endpoints
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
};

/**
 * Returns a clean Google Drive viewer URL that can be opened in a new tab.
 */
export const getGoogleDriveViewerUrl = (url?: string): string => {
  if (!url) return '';
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
};

/**
 * Formats a given URL (which could be Google Drive, local Data URL, or web link)
 * so that if it is a Google Drive image, it returns the direct image endpoint.
 */
export const resolveDisplayImageUrl = (url?: string): string => {
  if (!url) return '';
  if (isGoogleDriveUrl(url)) {
    return getGoogleDriveImageUrl(url, 1000);
  }
  return url;
};
