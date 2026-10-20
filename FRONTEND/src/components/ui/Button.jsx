import { Link } from "react-router-dom";

const styles = {
  primary: "bg-brand text-ink hover:bg-brand-hover",
  secondary: "border border-line text-ink hover:bg-line",
};

export default function Button({ variant = "primary", to, className = "", children, ...props }) {
  const classes = `inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-semibold transition-colors cursor-pointer ${styles[variant]} ${className}`;

  if (to) {
    return <Link to={to} className={classes}>{children}</Link>;
  }
  return <button className={classes} {...props}>{children}</button>;
}