import Text from "../../components/primitive/Text/Text";
import TabBar from "../../components/composite/TabBar/TabBar";
import ReviewTable from "../../components/compound/ReviewTable/ReviewTable";
import { useReviewTabs } from "./behavior/useReviewTabs";
import type { PostMessage, OnMessage } from "../../types";
import "./ReviewTabsView.css";

interface Props {
  postMessage: PostMessage;
  onMessage: OnMessage;
}

export default function ReviewTabsView({ postMessage, onMessage }: Props) {
  const { reviews, activeTab, setActiveTab, approve, reject } = useReviewTabs(postMessage, onMessage);

  if (reviews.length === 0) {
    return (
      <div className="review-tabs-view__empty">
        <Text>No pending reviews.</Text>
        <Text variant="hint">When Copilot needs your input on a batch of items, they will appear here as tabs.</Text>
      </div>
    );
  }

  const active = reviews.find((r) => r.id === activeTab);

  return (
    <div className="review-tabs-view">
      <TabBar
        tabs={reviews.map((r) => ({
          id: r.id,
          label: r.name,
          badge: r.status === "pending" ? r.items.length : undefined,
          variant: r.status === "building" ? "building" : undefined,
        }))}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {active && active.status === "building" && (
        <div className="review-tabs-view__building">
          <div className="review-tabs-view__building-header">
            <span className="review-tabs-view__building-dot" />
            <Text>Building review…</Text>
          </div>
          <Text variant="hint">
            AI is preparing this list. Items will appear as they are added.
          </Text>
          {active.items.length > 0 && (
            <ReviewTable review={active} readOnly />
          )}
        </div>
      )}

      {active && active.status === "pending" && (
        <ReviewTable
          review={active}
          onApprove={(selectedIds) => approve(active.id, selectedIds)}
          onReject={() => reject(active.id)}
        />
      )}
    </div>
  );
}
