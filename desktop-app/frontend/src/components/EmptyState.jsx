// src/components/EmptyState.jsx
import { InboxIcon } from "@heroicons/react/24/outline";

export default function EmptyState({ 
  title = "Aucune donnée", 
  description = "Aucun élément à afficher pour le moment.",
  icon: Icon = InboxIcon,
  action 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}