"use client";

import "./login.css";
import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [emailPrefix, setEmailPrefix] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/");
    });
    return () => unsubscribe();
  }, [router]);

  const getErrorMessage = (code: string) => {
    switch (code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Incorrect password.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleEmailChange = (val: string) => {
    // If user pastes a full email, strip the domain part
    if (val.includes("@")) {
      setEmailPrefix(val.split("@")[0]);
    } else {
      setEmailPrefix(val);
    }
  };

  const fullEmail = emailPrefix.trim()
    ? `${emailPrefix.trim()}@vitstudent.ac.in`
    : "";

  const handleSubmit = async () => {
    setError("");

    if (!emailPrefix.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, fullEmail, password);
      router.replace("/");
    } catch (err: any) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        try {
          const result = await createUserWithEmailAndPassword(
            auth,
            fullEmail,
            password,
          );
          await setDoc(doc(db, "users", result.user.uid), {
            email: result.user.email,
            createdAt: new Date().toISOString(),
          });
          router.replace("/");
        } catch (registerErr: any) {
          setError(getErrorMessage(registerErr.code));
        }
      } else {
        setError(getErrorMessage(err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-logo">
          <svg viewBox="0 0 24 24">
            <path d="M12 3L2 8l10 5 10-5-10-5z" />
            <path d="M2 8v6" />
            <path d="M6 10.5v4.5a6 6 0 0 0 12 0v-4.5" />
          </svg>
        </div>

        <p className="login-eyebrow">Attendance Tracker</p>
        <h1 className="login-title">Track every class.</h1>
        <p className="login-subtitle">
          Monitor attendance across subjects,
          <br />
          get safe-absence alerts before CATs.
        </p>

        <div className="login-divider" />

        <div className="login-fields">
          <div className="login-email-wrapper">
            <input
              className="login-input login-input-email"
              type="text"
              placeholder="your.name20YY"
              value={emailPrefix}
              onChange={(e) => handleEmailChange(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="email"
              disabled={loading}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <span className="login-email-suffix">@vitstudent.ac.in</span>
          </div>

          <div className="login-password-wrapper">
            <input
              className="login-input login-input-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              className="login-eye-btn"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            className="login-google-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <span className="login-spinner" />}
            <span className="login-google-btn-text">
              {loading ? "Please wait…" : "Continue"}
            </span>
          </button>

          <p className="login-hint">
            No account? One will be created automatically.
          </p>
        </div>

        <div className="login-stats">
          <div className="login-stat">
            <span className="login-stat-val">75%</span>
            <span className="login-stat-label">min required</span>
          </div>
          <div className="login-stat">
            <span className="login-stat-val">CAT</span>
            <span className="login-stat-label">safe tracking</span>
          </div>
          <div className="login-stat">
            <span className="login-stat-val">OD</span>
            <span className="login-stat-label">od support</span>
          </div>
        </div>

        <p className="login-footer">
          By continuing you agree to the
          <br />
          <span>Terms of Service</span> & <span>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
