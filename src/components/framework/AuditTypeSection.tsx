import { useDispatch } from "react-redux";
import { deleteAuditType } from "../../redux/auditType/auditType";

interface AuditType {
    id: string;
    value: string;
}

interface AuditTypeSectionProps {
    auditTypes: AuditType[];
}

const AuditTypeSection = ({ auditTypes }: AuditTypeSectionProps) => {
    const dispatch = useDispatch();

    const deleteAuditTypes = async (id: string) => {
        deleteAuditType(id, dispatch);
    };

     const getColorForType = (str: string) => {
        const colors = [
          "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100",
          "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100",
          "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100",
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100",
          "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100",
          "bg-pink-100 text-pink-700 dark:bg-pink-800 dark:text-pink-100",
          "bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-100",
          "bg-teal-100 text-teal-700 dark:bg-teal-800 dark:text-teal-100",
        ];
    
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
    
        const index = Math.abs(hash) % colors.length;
        return colors[index];
      };

    return (
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            🏷️ Audit Types
            </h2>

            {auditTypes.length === 0 ? (
            <div className="p-6 border rounded-2xl bg-gray-50 dark:bg-gray-900/20 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                No audit types found.
                </p>
            </div>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                {auditTypes.map((auditType) => (
                <div
                    key={auditType?.id}
                    className={`p-4 rounded-xl shadow-sm border hover:shadow-md transition relative group ${getColorForType(
                    auditType.value
                    )}`}
                >
                    <span className="font-semibold text-sm">{auditType?.value}</span>
                    <button
                        onClick={() => deleteAuditTypes(auditType.id)}
                        className="absolute top-2 right-2 text-gray-600 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    >
                    ✖
                    </button>
                </div>
                ))}
            </div>
            )}
        </section>
    );
};

export default AuditTypeSection;