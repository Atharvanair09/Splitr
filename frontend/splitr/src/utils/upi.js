/**
 * UPI Deep Link Utility
 * Generates UPI payment links and handles device detection
 */

/**
 * Generate a UPI deep link URL
 * @param {Object} params
 * @param {string} params.upiId - Receiver's UPI ID (e.g., user@paytm)
 * @param {string} params.name - Receiver's display name
 * @param {number} params.amount - Amount in INR
 * @param {string} [params.note] - Transaction note
 * @returns {string} UPI deep link URL
 */
export function generateUpiLink({ upiId, name, amount, note = "Split payment via Splitr" }) {
  if (!upiId || !upiId.trim()) {
    throw new Error("UPI ID is required");
  }

  if (!amount || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const params = new URLSearchParams({
    pa: upiId.trim(),
    pn: name || "User",
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });

  return `upi://pay?${params.toString()}`;
}

/**
 * Generate app-specific UPI intent URLs
 * @param {string} baseUpiLink - The base UPI deep link
 * @returns {Array<{name: string, icon: string, url: string}>}
 */
export function getUpiAppLinks(baseUpiLink) {
  return [
    {
      name: "Google Pay",
      icon: "gpay",
      url: baseUpiLink.replace("upi://", "tez://upi/"),
    },
    {
      name: "PhonePe",
      icon: "phonepe",
      url: baseUpiLink.replace("upi://", "phonepe://"),
    },
    {
      name: "Paytm",
      icon: "paytm",
      url: baseUpiLink.replace("upi://", "paytmmp://"),
    },
  ];
}

/**
 * Detect if the user is on a mobile device
 * @returns {boolean}
 */
export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

/**
 * Validate a UPI ID format (basic validation)
 * @param {string} upiId
 * @returns {boolean}
 */
export function isValidUpiId(upiId) {
  if (!upiId || typeof upiId !== "string") return false;
  // UPI ID format: username@bankhandle
  return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId.trim());
}
