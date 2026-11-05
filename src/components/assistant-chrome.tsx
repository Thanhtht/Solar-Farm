import { MessageCircle } from "lucide-react";
export function AssistantHeader() {
  return (
    <div className="panel-head">
      <div>
        <h2>Trợ lý AI</h2>
      </div>
      <MessageCircle size={22} />
    </div>
  );
}
