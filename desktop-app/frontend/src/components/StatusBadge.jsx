// frontend/src/components/BulkActionsModal.jsx
import { 
  XMarkIcon, 
  UserGroupIcon,
  DocumentArrowDownIcon,
  TagIcon,
  BellIcon
} from "@heroicons/react/24/outline";
import Modal from "./Modal";

export default function BulkActionsModal({
  open,
  onClose,
  selectedCount,
  onAction,
  actions = [],
  title = "Actions groupées",
  description = "Appliquer une action à plusieurs membres sélectionnés"
}) {
  const getActionIcon = (actionId) => {
    const icons = {
      export: DocumentArrowDownIcon,
      status: TagIcon,
      category: TagIcon,
      notification: BellIcon,
      default: UserGroupIcon,
    };
    return icons[actionId] || icons.default;
  };

  const getActionDescription = (actionId) => {
    const descriptions = {
      export: "Exporter les fiches des membres sélectionnés",
      status: "Modifier le statut de tous les membres sélectionnés",
      category: "Changer la catégorie d'âge des membres sélectionnés",
      notification: "Envoyer une notification aux membres sélectionnés",
      default: "Appliquer cette action à tous les membres sélectionnés",
    };
    return descriptions[actionId] || descriptions.default;
  };

  const handleAction = (actionId) => {
    onAction(actionId);
  };

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="p-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Selected count */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">
                {selectedCount} membre{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-blue-700">
                L'action sera appliquée à tous les membres sélectionnés
              </p>
            </div>
          </div>
        </div>

        {/* Actions list */}
        <div className="space-y-3 mb-6">
          {actions.map((action) => {
            const Icon = getActionIcon(action.id);
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-4"
              >
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{action.label}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {getActionDescription(action.id)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Warning */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ Cette action est irréversible et s'appliquera à tous les {selectedCount} membres sélectionnés.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              // Action par défaut
              onAction("export");
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Confirmer
          </button>
        </div>
      </div>
    </Modal>
  );
}