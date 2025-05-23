import { decode } from 'html-entities';

export function decodeHtmlEntities(text) {
  return decode(text);
}

export function cleanMessage(m) {
  let decodedM = decodeHtmlEntities(m);

  // Basic approach to remove empty <br> and trailing empty tags
  // React Native doesn't have a full DOM for manipulation, so this is simplified.
  let cleanedM = decodedM.replace(/<br\s*\/?>(\s*<br\s*\/?>)+/gi, '<br/>'); // Remove consecutive <br>
  cleanedM = cleanedM.replace(/<(\w+)>\s*<\/\1>$/gmi, ''); // Remove trailing empty tags

  // Simplified approach for ensuring the last <p> tag has margin-bottom: 0
  // This might require more sophisticated parsing if your HTML structure is complex.
  if (cleanedM.endsWith('</p>')) {
    cleanedM = cleanedM.slice(0, -4) + '<p style="margin-bottom:0;">' + cleanedM.slice(-4);
  }

  return cleanedM;
}

export function truncateHTML(html, maxLength) {
  let decodedHtml = decodeHtmlEntities(html);

  // Basic truncation - this will not be perfectly HTML-aware
  if (decodedHtml.length <= maxLength) {
    return decodedHtml;
  }

  let truncatedText = decodedHtml.substring(0, maxLength);

  // Ensure we don't cut off in the middle of an HTML tag (very basic check)
  const lastOpeningTag = truncatedText.lastIndexOf('<');
  const lastClosingTag = truncatedText.lastIndexOf('>');
  if (lastOpeningTag > lastClosingTag) {
    truncatedText = truncatedText.substring(0, lastOpeningTag);
  }

  return truncatedText.trim() + "...";
}