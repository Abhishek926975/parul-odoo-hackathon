import { Compass } from "lucide-react";
import Button from "./Button";

export default function EmptyState({ title, description, action, icon: Icon = Compass }) {
  return (
    <div className="traveloop-card flex flex-col items-center px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-traveloop-mist text-traveloop-midnight">
        <Icon size={24} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-traveloop-midnight">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-traveloop-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export { Button };
