import React from "react";
import zxcvbn from "zxcvbn";

interface PasswordStrengthBarProps {
  password: string;
  showText?: boolean;
  height?: string;
}

const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({
  password,
  showText = true,
  height = "8px",
}) => {
  // Calculate score
  const getScore = () => {
    if (password.length === 0) return 0;
    return zxcvbn(password).score;
  };

  const score = getScore();
  const normalizedScore = Math.max(0, Math.min(4, score));
  const percentage = normalizedScore === 4 ? 100 : (normalizedScore / 3) * 100;

  const colors = ["#ff4d4d", "#ff944d", "#ffcc00", "#4dff88", "#00cc66"];
  const texts = ["Very Weak", "Weak", "Okay-ish", "Strong", "Very Strong"];

  return (
    <div style={{ width: "100%", margin: "10px 0" }}>
      {showText && (
        <div style={{ marginBottom: "8px", fontSize: "14px", color: "#555" }}>
          <strong style={{ color: colors[normalizedScore] }}>
            {texts[normalizedScore]}
          </strong>
        </div>
      )}

      <div
        style={{
          width: "100%",
          height: height,
          backgroundColor: "#f0f0f0",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: colors[normalizedScore],
            borderRadius: "4px",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <div
        style={{
          textAlign: "right",
          fontSize: "12px",
          color: "#888",
          marginTop: "4px",
        }}
      >
        <small>Score: {normalizedScore}/4</small>
      </div>
    </div>
  );
};

export default PasswordStrengthBar;
