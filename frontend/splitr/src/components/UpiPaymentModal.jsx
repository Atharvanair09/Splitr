import React, { useState, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  generateUpiLink,
  getUpiAppLinks,
  isMobileDevice,
  isValidUpiId,
} from "../utils/upi";
import "./UpiPaymentModal.css";


function UpiPaymentModal({ from, to, amount, groupId, onClose, onSettled }) {
  const [step, setStep] = useState("input"); // input | pay | confirm
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState("");
  const [settling, setSettling] = useState(false);

  const mobile = useMemo(() => isMobileDevice(), []);

  // Generate UPI link when we have a valid ID
  const upiLink = useMemo(() => {
    if (!upiId || !isValidUpiId(upiId)) return null;
    try {
      return generateUpiLink({
        upiId,
        name: to,
        amount,
        note: `Splitr: ${from} pays ${to}`,
      });
    } catch {
      return null;
    }
  }, [upiId, to, from, amount]);

  const appLinks = useMemo(() => {
    if (!upiLink) return [];
    return getUpiAppLinks(upiLink);
  }, [upiLink]);

  const handleProceed = () => {
    setError("");

    if (!upiId.trim()) {
      setError("Please enter the receiver's UPI ID");
      return;
    }

    if (!isValidUpiId(upiId)) {
      setError("Invalid UPI ID format. Use format: username@bank");
      return;
    }

    setStep("pay");
  };

  const handleUpiRedirect = (url) => {
    window.location.href = url;
    // After a short delay, show confirmation
    setTimeout(() => {
      setStep("confirm");
    }, 1500);
  };

  const handleGenericPay = () => {
    if (upiLink) {
      handleUpiRedirect(upiLink);
    }
  };

  const handleShowQrConfirm = () => {
    setStep("confirm");
  };

  const handleConfirmYes = async () => {
    setSettling(true);
    try {
      // Record the settlement as an expense
      await fetch("http://localhost:5000/expense/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          amount,
          paidBy: from,
          splitBetween: [to],
          notes: `UPI Settlement: ${from} paid ${to}`,
        }),
      });

      onSettled();
    } catch (err) {
      console.error("Settlement failed:", err);
      setError("Failed to record settlement. Please try again.");
    } finally {
      setSettling(false);
    }
  };

  const handleConfirmNo = () => {
    setStep("pay");
    setError("");
  };

  return (
    <div className="upi-overlay" onClick={onClose}>
      <div className="upi-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="upi-close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="upi-header">
          <div className="upi-header-icon">⚡</div>
          <h2 className="upi-title">Pay via UPI</h2>
          <div className="upi-payment-info">
            <div className="upi-avatars">
              <div className="upi-avatar upi-avatar-from">
                {from.charAt(0).toUpperCase()}
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
              <div className="upi-avatar upi-avatar-to">
                {to.charAt(0).toUpperCase()}
              </div>
            </div>
            <p className="upi-amount">₹{amount.toFixed(2)}</p>
            <p className="upi-desc">
              <strong>{from}</strong> pays <strong>{to}</strong>
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="upi-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* STEP 1: UPI ID Input */}
        {step === "input" && (
          <div className="upi-step">
            <label className="upi-label">Receiver's UPI ID</label>
            <div className="upi-input-wrap">
              <input
                type="text"
                className="upi-input"
                placeholder="e.g. username@paytm"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleProceed()}
                autoFocus
              />
              <span className="upi-input-icon">@</span>
            </div>
            <p className="upi-hint">
              Enter the UPI ID of <strong>{to}</strong> to proceed
            </p>
            <button className="upi-btn-primary" onClick={handleProceed}>
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* STEP 2: Payment Options */}
        {step === "pay" && (
          <div className="upi-step">
            {/* Mobile: Show app buttons + generic UPI button */}
            {mobile ? (
              <>
                <button className="upi-btn-primary upi-btn-generic" onClick={handleGenericPay}>
                  ⚡ Pay ₹{amount.toFixed(2)} via UPI
                </button>

                <div className="upi-divider">
                  <span>or pay with</span>
                </div>

                <div className="upi-app-grid">
                  {appLinks.map((app) => (
                    <button
                      key={app.name}
                      className={`upi-app-btn upi-app-${app.icon}`}
                      onClick={() => handleUpiRedirect(app.url)}
                    >
                      <span className="upi-app-icon">
                        {app.icon === "gpay" && (
                          <svg viewBox="0 0 24 24" width="22" height="22">
                            <path fill="#4285F4" d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                          </svg>
                        )}
                        {app.icon === "phonepe" && (
                          <svg viewBox="0 0 24 24" width="22" height="22">
                            <path fill="#5F259F" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.2 14.4l-2.4-2.4-2.4 2.4-1.6-1.6 2.4-2.4-2.4-2.4 1.6-1.6 2.4 2.4 2.4-2.4 1.6 1.6-2.4 2.4 2.4 2.4-1.6 1.6z"/>
                          </svg>
                        )}
                        {app.icon === "paytm" && (
                          <svg viewBox="0 0 24 24" width="22" height="22">
                            <path fill="#00BAF2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V7h2v10zm4 0h-2V7h2v10z"/>
                          </svg>
                        )}
                      </span>
                      {app.name}
                    </button>
                  ))}
                </div>

                <button
                  className="upi-btn-text"
                  onClick={() => setStep("confirm")}
                >
                  I've already paid →
                </button>
              </>
            ) : (
              /* Desktop: Show QR Code */
              <>
                <div className="upi-qr-section">
                  <p className="upi-qr-label">Scan with any UPI app</p>
                  <div className="upi-qr-container">
                    {upiLink && (
                      <QRCodeSVG
                        value={upiLink}
                        size={200}
                        bgColor="#FFFFFF"
                        fgColor="#0B132B"
                        level="M"
                        includeMargin={true}
                      />
                    )}
                  </div>
                  <p className="upi-qr-id">
                    UPI ID: <strong>{upiId}</strong>
                  </p>
                  <p className="upi-qr-amount">
                    Amount: <strong>₹{amount.toFixed(2)}</strong>
                  </p>
                </div>

                <button
                  className="upi-btn-primary"
                  onClick={handleShowQrConfirm}
                >
                  I've completed the payment
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        {/* STEP 3: Confirmation */}
        {step === "confirm" && (
          <div className="upi-step upi-confirm-step">
            <div className="upi-confirm-icon">🤔</div>
            <h3 className="upi-confirm-title">Did you complete the payment?</h3>
            <p className="upi-confirm-desc">
              Confirm if you've paid <strong>₹{amount.toFixed(2)}</strong> to{" "}
              <strong>{to}</strong> via UPI
            </p>

            <div className="upi-confirm-buttons">
              <button
                className="upi-btn-confirm-yes"
                onClick={handleConfirmYes}
                disabled={settling}
              >
                {settling ? (
                  <>
                    <span className="upi-btn-spinner" />
                    Recording...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Yes, I've paid
                  </>
                )}
              </button>
              <button
                className="upi-btn-confirm-no"
                onClick={handleConfirmNo}
                disabled={settling}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                No, go back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UpiPaymentModal;
