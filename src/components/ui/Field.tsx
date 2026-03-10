const inputClass =
  "w-full border border-black bg-white px-2 py-1.5 text-sm text-black placeholder:text-gray-500 focus:outline focus:outline-2 focus:outline-[#0000cc] focus:outline-offset-0";

interface FieldProps {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
}

export function Field({
  name,
  label,
  type = "text",
  required = false,
  defaultValue = "",
  error,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm text-black"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className={`${inputClass} ${error ? "border-red-700" : ""}`}
      />
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export { inputClass };
