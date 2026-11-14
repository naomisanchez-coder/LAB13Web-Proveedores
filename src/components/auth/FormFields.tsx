"use client";
import { useState, type InputHTMLAttributes } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; icon?: React.ReactNode };
export function FormField({ label, error, hint, icon, id, name, ...props }: FieldProps) {
  const fieldId = id ?? name;
  const describedBy = [hint ? `${fieldId}-hint` : '', error ? `${fieldId}-error` : ''].filter(Boolean).join(' ') || undefined;
  return <div className="form-field">
    <label htmlFor={fieldId}>{label}</label>
    <div className={`input-wrap${error ? ' input-invalid' : ''}`}>
      {icon && <span className="input-icon" aria-hidden="true">{icon}</span>}
      <input {...props} id={fieldId} name={name} className={icon ? 'with-icon' : ''} aria-invalid={!!error} aria-describedby={describedBy} />
    </div>
    {hint && <p className="field-hint" id={`${fieldId}-hint`}>{hint}</p>}
    {error && <p className="field-error" id={`${fieldId}-error`}>{error}</p>}
  </div>;
}
export function PasswordField({ label, error, hint, id, name, ...props }: Omit<FieldProps, 'type' | 'icon'>) {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? name;
  return <div className="form-field">
    <label htmlFor={fieldId}>{label}</label>
    <div className={`input-wrap${error ? ' input-invalid' : ''}`}>
      <span className="input-icon" aria-hidden="true"><FiLock /></span>
      <input {...props} type={visible?'text':'password'} id={fieldId} name={name} className="with-icon with-toggle"
        aria-invalid={!!error} aria-describedby={[hint?`${fieldId}-hint`:'',error?`${fieldId}-error`:''].filter(Boolean).join(' ')||undefined} />
      <button className="password-toggle" type="button" aria-label={`${visible?'Ocultar':'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<FiEyeOff />:<FiEye />}</button>
    </div>
    {hint && <p className="field-hint" id={`${fieldId}-hint`}>{hint}</p>}
    {error && <p className="field-error" id={`${fieldId}-error`}>{error}</p>}
  </div>;
}
