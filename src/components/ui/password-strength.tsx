import { useState, useEffect } from "react";
import { Badge } from "./badge";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  showDetails?: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  icon: React.ReactNode;
}

export function PasswordStrength({ password, showDetails = true }: PasswordStrengthProps) {
  const [strength, setStrength] = useState<{
    score: number;
    label: string;
    color: string;
  }>({ score: 0, label: "Очень слабый", color: "bg-red-500" });

  const requirements: PasswordRequirement[] = [
    {
      label: "Минимум 8 символов",
      test: (pwd) => pwd.length >= 8,
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      label: "Строчная буква",
      test: (pwd) => /[a-z]/.test(pwd),
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      label: "Заглавная буква",
      test: (pwd) => /[A-Z]/.test(pwd),
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      label: "Цифра",
      test: (pwd) => /\d/.test(pwd),
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      label: "Специальный символ",
      test: (pwd) => /[@$!%*?&]/.test(pwd),
      icon: <CheckCircle className="h-4 w-4" />
    }
  ];

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, label: "Очень слабый", color: "bg-red-500" });
      return;
    }

    let score = 0;
    requirements.forEach(req => {
      if (req.test(password)) score++;
    });

    // Дополнительные баллы за длину
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    let label = "";
    let color = "";

    if (score <= 2) {
      label = "Очень слабый";
      color = "bg-red-500";
    } else if (score <= 3) {
      label = "Слабый";
      color = "bg-orange-500";
    } else if (score <= 4) {
      label = "Средний";
      color = "bg-yellow-500";
    } else if (score <= 5) {
      label = "Хороший";
      color = "bg-blue-500";
    } else {
      label = "Отличный";
      color = "bg-green-500";
    }

    setStrength({ score, label, color });
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Индикатор силы */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Сила пароля:</span>
          <Badge variant="outline" className="text-xs">
            {strength.label}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${Math.min((strength.score / 6) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Детали требований */}
      {showDetails && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Требования к паролю:</p>
          <div className="grid gap-2">
            {requirements.map((req, index) => {
              const isMet = req.test(password);
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {isMet ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={isMet ? "text-green-700" : "text-red-700"}>
                    {req.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
