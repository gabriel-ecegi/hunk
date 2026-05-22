import type { MouseEvent as TuiMouseEvent } from "@opentui/core";
import type { DiffFile } from "../../../core/types";
import { fileLabelParts } from "../../lib/files";
import { fitText } from "../../lib/text";
import type { AppTheme } from "../../themes";

interface ViewedIndicator {
  viewed: boolean;
  onToggle: () => void;
}

interface DiffFileHeaderRowProps {
  file: DiffFile;
  headerLabelWidth: number;
  headerStatsWidth: number;
  theme: AppTheme;
  onSelect?: () => void;
  viewedIndicator?: ViewedIndicator;
}

/** Render one file header row in the review stream or sticky overlay. */
export function DiffFileHeaderRow({
  file,
  headerLabelWidth,
  headerStatsWidth,
  theme,
  onSelect,
  viewedIndicator,
}: DiffFileHeaderRowProps) {
  const additionsText = `+${file.stats.additions}${file.statsTruncated ? "+" : ""}`;
  const deletionsText = `-${file.stats.deletions}`;
  const { filename, stateLabel } = fileLabelParts(file);
  const viewedText = viewedIndicator ? `${viewedIndicator.viewed ? "[x]" : "[ ]"} Viewed` : null;
  const viewedWidth = viewedText?.length ?? 0;
  const viewedClusterWidth = viewedText ? viewedWidth + 1 : 0;
  const trailingStatsPaddingWidth = viewedText ? 0 : 1;
  const labelWidth = Math.max(1, headerLabelWidth - viewedClusterWidth);
  const rightClusterWidth = headerStatsWidth + viewedClusterWidth + trailingStatsPaddingWidth;

  const handleViewedToggle = (event: TuiMouseEvent) => {
    event.stopPropagation();
    viewedIndicator?.onToggle();
  };

  return (
    <box
      style={{
        width: "100%",
        height: 1,
        flexShrink: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 1,
        paddingRight: 1,
        backgroundColor: theme.panel,
      }}
      onMouseUp={onSelect}
    >
      {/* Clicking the file header jumps the main stream selection without collapsing to a single-file view. */}
      <box style={{ width: labelWidth, height: 1, flexDirection: "row" }}>
        <text fg={theme.text}>
          {fitText(filename, Math.max(1, labelWidth - (stateLabel?.length ?? 0)))}
        </text>
        {stateLabel && <text fg={theme.muted}>{stateLabel}</text>}
      </box>
      <box
        style={{
          width: rightClusterWidth,
          height: 1,
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <box
          style={{
            width: headerStatsWidth,
            height: 1,
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <text fg={theme.badgeAdded}>{additionsText}</text>
          <text fg={theme.muted}> </text>
          <text fg={theme.badgeRemoved}>{deletionsText}</text>
        </box>
        {viewedText ? <text fg={theme.muted}> </text> : <text fg={theme.muted}> </text>}
        {viewedText ? (
          <box style={{ width: viewedWidth, height: 1 }} onMouseUp={handleViewedToggle}>
            <text fg={viewedIndicator?.viewed ? theme.badgeNeutral : theme.accent}>{viewedText}</text>
          </box>
        ) : null}
      </box>
    </box>
  );
}
