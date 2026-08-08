/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Centralized utility function to format numbers as Kenyan Shillings (e.g., 'KES 1,200').
 */
export function formatKES(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "KES 0";
  }
  return `KES ${Math.round(Number(amount)).toLocaleString("en-KE")}`;
}

export function formatKSh(amount: number | null | undefined): string {
  return formatKES(amount);
}
