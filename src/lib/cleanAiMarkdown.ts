/**
 * Utility function to sanitize and format AI output strings.
 * Removes orphan colons, malformed markdown bold tags, raw asterisk rating strings,
 * and fixes formatting issues so AI responses render cleanly.
 */
export function cleanAiMarkdown(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // 1. Fix orphan bold colon structures like "**:", "**: **", "** : **", "**:"
  cleaned = cleaned.replace(/\*\*\s*:\s*\*\*/g, "");
  cleaned = cleaned.replace(/\*\*\s*:\s*/g, ": ");
  cleaned = cleaned.replace(/:\s*\*\*/g, ": ");

  // 2. Remove duplicate colons like "::" or ": :"
  cleaned = cleaned.replace(/::+/g, ":");

  // 3. Remove leading colon on a line or right after bullet points like "* :" or "- :"
  cleaned = cleaned.replace(/^(\s*[-*])\s*:\s*/gm, "$1 ");

  // 4. Transform raw star strings or ratings like "Rating: 5/5 *****" or "Rating: 4.8/5" into clean text
  cleaned = cleaned.replace(/Rating:\s*([0-9.]+)\/5\s*(\*+|\u2605+)?/gi, "Rating: $1 / 5 ★");

  // 5. Replace standalone raw asterisk strings (3 to 5 asterisks) with clean star symbols
  cleaned = cleaned.replace(/(?<=[\s:(])\*{3,5}(?=[\s:).,]|$)/g, "★★★★★");

  // 6. Clean up empty bold or italic markdown tags like "****" or "** **"
  cleaned = cleaned.replace(/\*\*\s*\*\*/g, "");

  // 7. Remove any trailing or orphan colons before newlines or at the end of sentences like "Spec :"
  cleaned = cleaned.replace(/\s+:\s*(?=\n|$)/g, "");

  return cleaned.trim();
}

