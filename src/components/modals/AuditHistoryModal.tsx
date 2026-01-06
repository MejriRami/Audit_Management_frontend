import { useEffect } from "react";
import { format } from "date-fns";
import { Modal } from "../ui/modal";
import { useSelector } from "react-redux";
import { fetchAuditHistory } from "../../redux/audit/audit-slice";
import { useAppDispatch } from "../../redux/hooks";
import { RootState } from "../../redux/store";
import { Audit } from "../../redux/audit/audit-types";

interface AuditHistoryModalProps {
  audit: Audit;
  onClose: () => void;
}

export default function AuditHistoryModal({
  audit,
  onClose,
}: AuditHistoryModalProps) {
  const dispatch = useAppDispatch();

  const { historyByAuditId, historyLoading } = useSelector(
    (state: RootState) => state.audit
  );

  useEffect(() => {
    dispatch(fetchAuditHistory(audit.id));
  }, [dispatch, audit.id]);

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-[600px] p-6">
      <h2 className="text-xl font-semibold mb-4">Reschedule History</h2>

      {historyLoading && <p className="text-sm text-gray-500">Loading...</p>}

      {!historyLoading && historyByAuditId?.length === 0 && (
        <p className="text-gray-500 text-sm">No reschedule actions found.</p>
      )}

      {!historyLoading && (
        <div className="max-h-[60vh] overflow-y-auto pr-4">
          <div className="relative border-l border-gray-300 ml-4 mt-4">
            {historyByAuditId.map((h) => (
              <div key={h.id} className="mb-6 ml-4 relative">
                <div className="absolute -left-5 top-1 w-3 h-3 bg-indigo-600 rounded-full" />

                <p className="font-semibold text-sm">
                  {h.action_type.toUpperCase()}
                </p>

                <p className="text-xs text-gray-500">
                  {format(new Date(h.created_at), "PPpp")}
                </p>

                <div className="mt-2 text-sm">
                  <p>
                    <strong>Old Date:</strong>{" "}
                    {h.old_date ? format(new Date(h.old_date), "PPpp") : "-"}
                  </p>

                  <p>
                    <strong>New Date:</strong>{" "}
                    {h.new_date ? format(new Date(h.new_date), "PPpp") : "-"}
                  </p>

                  {h.reason && (
                    <p className="mt-2">
                      <strong>Reason:</strong> {h.reason}
                    </p>
                  )}

                  {h.changed_by && (
                    <p className="text-xs text-gray-500 mt-1">
                      Changed by: {h.changed_by}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
